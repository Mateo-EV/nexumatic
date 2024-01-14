import { type User } from "@prisma/client";
import { create } from "zustand";

type ModalType = "UserManage";

type ModalData = {
  user?: Omit<User, "image" | "password">;
  userId?: number;
};

type useModalStore = {
  type: ModalType | null;
  isOpen: boolean;
  data: ModalData;
  close: () => void;
  open: (type: ModalType, data?: ModalData) => void;
};

export const useModal = create<useModalStore>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  close: () => set({ isOpen: false, type: null }),
  open: (type, data = {}) => set({ isOpen: true, type, data: data }),
}));
