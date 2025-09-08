import { Phone, Users, Video } from "lucide-react";

type Props = {
  resolvedTheme: string | undefined;
};

export default function WelcomePanel({ resolvedTheme }: Props) {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <img
            src={
              resolvedTheme === "dark" ? "/dark_logo.svg" : "/light_logo.svg"
            }
            alt="Frequency Logo"
            className="h-20 w-20 object-contain"
          />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-foreground">
          Welcome to Frequency
        </h3>
        <p className="text-base mb-6 text-muted-foreground">
          Your modern, real-time chat application for seamless communication
        </p>

        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Create Groups
              </h4>
              <p className="text-sm text-muted-foreground">
                Start group conversations with multiple people and collaborate
                effectively
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Real-time Messaging
              </h4>
              <p className="text-sm text-muted-foreground">
                Send instant messages with real-time updates and notifications
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Rich Media</h4>
              <p className="text-sm text-muted-foreground">
                Share photos, files, and emojis to express yourself better
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Getting Started:</strong> Select a conversation from the
            sidebar or create a new group to start chatting!
          </p>
        </div>
      </div>
    </div>
  );
}
