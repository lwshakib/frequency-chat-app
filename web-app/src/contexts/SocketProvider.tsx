import type React from "react";
import { useEffect, useState } from "react";

export const SocketContext = React.createContext(null)

export const SocketProvider = ({children}: {children: React.ReactNode})=>{
    const [socket, setSocket] = useState();

    useEffect(()=>{
        
    })
    return(
    <SocketContext.Provider value={{socket}}>
        {children}
    </SocketContext.Provider>)
}