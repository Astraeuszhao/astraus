import React, { createContext, useContext, useState, useCallback } from "react";

type LikeState = {
  [imageId: string]: { liked: boolean; count: number };
};

const LikeContext = createContext<{
  likes: LikeState;
  setLike: (imageId: string, liked: boolean, count: number) => void;
  fetchLikeIfNeeded: (imageId: string) => Promise<void>;
  refetchAllLikes: (imageIds: string[]) => Promise<void>;
  visibleImageIds: string[];
  setVisibleImageIds: (ids: string[]) => void;
  refetchingAfterLogin: boolean;
  setRefetchingAfterLogin: (v: boolean) => void;
}>({
  likes: {},
  setLike: () => {},
  fetchLikeIfNeeded: async () => {},
  refetchAllLikes: async () => {},
  visibleImageIds: [],
  setVisibleImageIds: () => {},
  refetchingAfterLogin: false,
  setRefetchingAfterLogin: () => {},
});

export const useLike = () => useContext(LikeContext);

export const LikeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likes, setLikes] = useState<LikeState>({});
  const [visibleImageIds, setVisibleImageIds] = useState<string[]>([]);
  const [refetchingAfterLogin, setRefetchingAfterLogin] = useState(false);

  function setLike(imageId: string, liked: boolean, count: number) {
    setLikes(prev => ({ ...prev, [imageId]: { liked, count } }));
  }

  // Only fetch if not already cached
  const fetchLikeIfNeeded = useCallback(async (imageId: string) => {
    if (likes[imageId]) return;
    const res = await fetch(`/api/images/${imageId}/like`);
    if (res.ok) {
      const data = await res.json();
      setLike(imageId, data.liked, data.count);
    }
  }, [likes]);

  // Refetch all likes for a list of image IDs
  const refetchAllLikes = useCallback(async (imageIds: string[]) => {
    await Promise.all(
      imageIds.map(async (id) => {
        const res = await fetch(`/api/images/${id}/like`);
        if (res.ok) {
          const data = await res.json();
          setLike(id, data.liked, data.count);
        }
      })
    );
  }, []);

  return (
    <LikeContext.Provider value={{
      likes,
      setLike,
      fetchLikeIfNeeded,
      refetchAllLikes,
      visibleImageIds,
      setVisibleImageIds,
      refetchingAfterLogin,
      setRefetchingAfterLogin,
    }}>
      {children}
    </LikeContext.Provider>
  );
};