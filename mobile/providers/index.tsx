import { PropsWithChildren } from "react";
import TRPCProvider from "@/providers/trpc";

const Providers = ({ children }: PropsWithChildren) => {
  return <TRPCProvider>{children}</TRPCProvider>;
};
