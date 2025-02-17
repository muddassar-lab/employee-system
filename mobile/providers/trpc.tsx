import { trpc } from "@/lib/utils/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { PropsWithChildren, useState } from "react";
import superjson from "superjson/dist/index";

const TRPCProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: {
        serialize: (data: any) => {
          return superjson.serialize(data);
        },
        deserialize: (data: any) => {
          const isSuperJson = data.json !== undefined;
          if (isSuperJson) {
            return superjson.deserialize(data);
          } else {
            return data;
          }
        },
      },
      links: [
        httpBatchLink({
          url: "http://192.168.1.2:5000/trpc",
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};

export default TRPCProvider;
