import dotenv from "dotenv";
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
let presenceConsumer = null;

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

export async function produceUserPresence(payload) {
  const producer = await createProducer();
  const value = JSON.stringify(payload);
  await producer.send({
    messages: [{ key: `presence-${payload.clerkId}-${Date.now()}`, value }],
    topic: "USER_PRESENCE",
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

export async function startPresenceConsumer() {
  console.log("Starting Kafka presence consumer...");

  presenceConsumer = kafka.consumer({
    groupId: "presence",
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    maxWaitTimeInMs: 5000,
    retry: {
      initialRetryTime: 100,
      retries: 8,
      maxRetryTime: 30000,
    },
  });

  presenceConsumer.on("consumer.crash", (event) => {
    console.error("Presence consumer crashed:", event.payload);
  });

  presenceConsumer.on("consumer.disconnect", (event) => {
    console.log("Presence consumer disconnected:", event.payload);
  });

  presenceConsumer.on("consumer.stop", (event) => {
    console.log("Presence consumer stopped:", event.payload);
  });

  try {
    await presenceConsumer.connect();
    console.log("Presence consumer connected successfully");

    await presenceConsumer.subscribe({
      topic: "USER_PRESENCE",
      fromBeginning: false,
    });
    console.log("Presence consumer subscribed to USER_PRESENCE topic");

    await presenceConsumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100,
      eachMessage: async ({ message, pause, heartbeat }) => {
        try {
          await heartbeat();

          if (!message.value) {
            console.log("Received empty presence message, skipping");
            return;
          }
          console.log(message.value);

          const presence = JSON.parse(message.value);
          const { clerkId, isOnline, lastOnlineAt } = presence || {};
          if (!clerkId) return;

          await prisma.user.update({
            where: { clerkId },
            data: {
              isOnline: Boolean(isOnline),
              lastOnlineAt: lastOnlineAt ? new Date(lastOnlineAt) : new Date(),
            },
          });
        } catch (err) {
          console.error("Error processing presence:", err);
          console.log(
            "Pausing presence consumer for 10 seconds before retry..."
          );
          pause();
          setTimeout(() => {
            console.log("Resuming presence consumer...");
            presenceConsumer.resume([{ topic: "USER_PRESENCE" }]);
          }, 10 * 1000);
        }
      },
    });

    console.log(
      "Presence consumer is running and processing presence messages"
    );
  } catch (error) {
    console.error("Failed to start presence consumer:", error);
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
  if (presenceConsumer) {
    try {
      console.log("Stopping Kafka presence consumer...");
      await presenceConsumer.disconnect();
      console.log("Kafka presence consumer stopped successfully");
    } catch (error) {
      console.error("Error stopping Kafka presence consumer:", error);
    }
  }
}

export default kafka;
