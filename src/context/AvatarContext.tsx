import React, { createContext, useContext, useState } from "react";

const AvatarContext = createContext<{
  avatar: string;
  setAvatar: (url: string) => void;
}>({
  avatar: "/avatar.png",
  setAvatar: () => {},
});

export const useAvatar = () => useContext(AvatarContext);

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [avatar, setAvatar] = useState("/avatar.png");
  return (
    <AvatarContext.Provider value={{ avatar, setAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};