import dotenv from "dotenv";
import fs from "fs";
import { Kafka } from "kafkajs";
import prisma from "./prisma.js";

dotenv.config();

const kafka = new Kafka({
  clientId: "my-app",
  brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
  ssl: {
    ca: process.env.KAFKA_CERTIFICATE,
  },
  sasl: {
    mechanism: "plain", // Or "scram-sha-256"/"scram-sha-512" depending on provider
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
  connectionTimeout: 30000,
  requestTimeout: 60000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
    restartOnFailure: async (e) => {
      console.log("Kafka consumer restarting due to failure:", e.message);
      return true;
    },
  },
  logLevel: 2, // INFO level
});

let producer = null;
let consumer = null;

export async function createProducer() {
  if (producer) return producer;

  const _producer = kafka.producer();
  await _producer.connect();
  producer = _producer;
  return producer;
}

export async function produceMessage(data) {
  const producer = await createProducer();
  await producer.send({
    messages: [{ key: `message-${Date.now()}`, value: data }],
    topic: "MESSAGES",
  });
  return true;
}

export async function startMessageConsumer() {
  console.log("Starting Kafka consumer...");

  consumer = kafka.consumer({
    groupId: "default",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 5000,
    retry: {
      initialRetryTime: 100,
      retries: 8,
      maxRetryTime: 30000,
    },
  });

  // Add error handling for consumer events
  consumer.on("consumer.crash", (event) => {
    console.error("Consumer crashed:", event.payload);
  });

  consumer.on("consumer.disconnect", (event) => {
    console.log("Consumer disconnected:", event.payload);
  });

  consumer.on("consumer.stop", (event) => {
    console.log("Consumer stopped:", event.payload);
  });

  try {
    await consumer.connect();
    console.log("Consumer connected successfully");

    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });
    console.log("Consumer subscribed to MESSAGES topic");

    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
      eachMessage: async ({ message, pause, heartbeat }) => {
        try {
          // Send heartbeat to keep the session alive
          await heartbeat();

          if (!message.value) {
            console.log("Received empty message, skipping");
            return;
          }

          const messageData = JSON.parse(message.value).message;
          console.log("Processing message:", messageData);

          const newMessage = await prisma.message.create({
            data: {
              content: messageData.content,
              conversationId: messageData.conversationId,
              isRead: messageData.isRead,
              senderId: messageData.senderId,
              files: messageData.files,
              type: messageData.type,
            },
          });

          await prisma.conversation.update({
            where: { id: newMessage.conversationId },
            data: { lastMessageId: newMessage.id },
          });

          console.log("Message processed successfully");
        } catch (err) {
          console.error("Error processing message:", err);
          console.log("Pausing consumer for 30 seconds before retry...");
          pause();
          setTimeout(() => {
            console.log("Resuming consumer...");
            consumer.resume([{ topic: "MESSAGES" }]);
          }, 30 * 1000);
        }
      },
    });

    console.log("Consumer is running and processing messages");
  } catch (error) {
    console.error("Failed to start consumer:", error);
    throw error;
  }
}

export async function stopMessageConsumer() {
  if (consumer) {
    try {
      console.log("Stopping Kafka consumer...");
      await consumer.disconnect();
      console.log("Kafka consumer stopped successfully");
    } catch (error) {
      console.error("Error stopping Kafka consumer:", error);
    }
  }
}

export async function stopProducer() {
  if (producer) {
    try {
      console.log("Stopping Kafka producer...");
      await producer.disconnect();
      console.log("Kafka producer stopped successfully");
    } catch (error) {
      console.error("Error stopping Kafka producer:", error);
    }
  }
}

export async function gracefulShutdown() {
  console.log("Gracefully shutting down Kafka services...");
  await Promise.all([stopMessageConsumer(), stopProducer()]);
}

export default kafka;
