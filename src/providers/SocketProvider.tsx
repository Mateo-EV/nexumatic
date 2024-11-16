// "use client";

// import { createContext, useEffect, useState } from "react";
// import PusherJs from "pusher-js";
// import { env } from "@/env";

// type SocketContextType = {
//   client: PusherJs;
// };

// const SocketContext = createContext<SocketContextType>(null!);

// export default function SocketProvider({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const [client, setClient] = useState<PusherJs>(null!);

//   useEffect(() => {

//     setClient(client);
//   }, []);

//   return (
//     <SocketContext.Provider value={{ client }}>
//       {children}
//     </SocketContext.Provider>
//   );
// }
