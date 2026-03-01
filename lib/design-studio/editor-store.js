// lib/design-studio/editor-store.js — Zustand store for design editor state
import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_UNDO = 30;

export const useEditorStore = create(
  persist(
    (set, get) => ({
      // --- Product context ---
      productSlug: null,
      productSpec: null,
      templateId: null,

      // --- Canvas state ---
      canvasJSON: null,
      selectedObjectId: null,
      activePanel: "templates", // templates | text | images | shapes | layers
      showGuides: true,
      zoom: 1,

      // --- History ---
      undoStack: [],
      redoStack: [],

      // --- Approval ---
      approvalStatus: "editing", // editing | preflight | approved
      approvedUploadUrls: null, // { pngUrl, pdfUrl }

      // --- Actions ---
      setProductContext: (slug, spec) =>
        set({ productSlug: slug, productSpec: spec }),

      setTemplateId: (id) => set({ templateId: id }),

      setCanvasJSON: (json) => set({ canvasJSON: json }),

      setSelectedObjectId: (id) => set({ selectedObjectId: id }),

      setActivePanel: (panel) => set({ activePanel: panel }),

      setZoom: (zoom) => set({ zoom }),

      toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),

      pushUndo: (json) => {
        const { undoStack } = get();
        const newStack = [...undoStack, json].slice(-MAX_UNDO);
        set({ undoStack: newStack, redoStack: [] });
      },

      undo: () => {
        const { undoStack, canvasJSON } = get();
        if (undoStack.length === 0) return null;
        const prev = undoStack[undoStack.length - 1];
        set({
          undoStack: undoStack.slice(0, -1),
          redoStack: canvasJSON
            ? [...get().redoStack, canvasJSON]
            : get().redoStack,
          canvasJSON: prev,
        });
        return prev;
      },

      redo: () => {
        const { redoStack, canvasJSON } = get();
        if (redoStack.length === 0) return null;
        const next = redoStack[redoStack.length - 1];
        set({
          redoStack: redoStack.slice(0, -1),
          undoStack: canvasJSON
            ? [...get().undoStack, canvasJSON]
            : get().undoStack,
          canvasJSON: next,
        });
        return next;
      },

      setApprovalStatus: (status) => set({ approvalStatus: status }),

      setApprovedUploadUrls: (urls) => set({ approvedUploadUrls: urls }),

      resetEditor: () =>
        set({
          canvasJSON: null,
          selectedObjectId: null,
          undoStack: [],
          redoStack: [],
          approvalStatus: "editing",
          approvedUploadUrls: null,
          templateId: null,
        }),
    }),
    {
      name: "lunar-design-studio",
      partialize: (state) => ({
        canvasJSON: state.canvasJSON,
        productSlug: state.productSlug,
        templateId: state.templateId,
        showGuides: state.showGuides,
      }),
    }
  )
);
