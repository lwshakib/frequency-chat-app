import { Skeleton } from "@/components/ui/skeleton";

export default function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`flex ${
            index % 3 === 0 ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`flex max-w-[70%] ${
              index % 3 === 0 ? "flex-row-reverse" : "flex-row"
            } items-end space-x-2`}
          >
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton
                className={`h-12 ${
                  index % 3 === 0 ? "w-32" : "w-40"
                } rounded-2xl`}
              />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
