"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  createSubscription,
  updateSubscription,
  type SubscriptionInput,
} from "@/lib/db/subscriptions";
import type { Subscription } from "@/lib/domain/schema";
import { SubscriptionForm } from "./subscription-form";

const FORM_ID = "subscription-form";

type SheetState =
  { kind: "closed" } | { kind: "add" } | { kind: "edit"; subscription: Subscription };

interface SubscriptionSheetContextValue {
  openAdd: () => void;
  openEdit: (subscription: Subscription) => void;
}

const SubscriptionSheetContext = createContext<SubscriptionSheetContextValue | null>(
  null,
);

export function SubscriptionSheetProvider({ children }: { children: ReactNode }) {
  const { settings } = useAppData();
  const { showToast } = useToast();
  const [state, setState] = useState<SheetState>({ kind: "closed" });

  const openAdd = useCallback(() => setState({ kind: "add" }), []);
  const openEdit = useCallback(
    (subscription: Subscription) => setState({ kind: "edit", subscription }),
    [],
  );
  const close = useCallback(() => setState({ kind: "closed" }), []);

  const api = useMemo<SubscriptionSheetContextValue>(
    () => ({ openAdd, openEdit }),
    [openAdd, openEdit],
  );

  const editing = state.kind === "edit" ? state.subscription : null;

  async function handleSubmit(input: SubscriptionInput) {
    try {
      if (editing) {
        await updateSubscription(editing.id, input);
        showToast("Subscription updated", "success");
      } else {
        await createSubscription(input);
        showToast("Subscription added", "success");
      }
      close();
    } catch {
      showToast("Something went wrong. Try again.", "danger");
    }
  }

  return (
    <SubscriptionSheetContext.Provider value={api}>
      {children}
      <Sheet
        open={state.kind !== "closed"}
        onClose={close}
        title={editing ? "Edit subscription" : "Add subscription"}
        description="Nothing here leaves your device."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={close} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} className="flex-1">
              {editing ? "Save changes" : "Add subscription"}
            </Button>
          </div>
        }
      >
        {state.kind !== "closed" ? (
          <SubscriptionForm
            key={editing?.id ?? "new"}
            formId={FORM_ID}
            initial={editing}
            defaultCurrency={settings.displayCurrency}
            defaultLeadDays={settings.defaultLeadDays}
            onSubmit={handleSubmit}
          />
        ) : null}
      </Sheet>
    </SubscriptionSheetContext.Provider>
  );
}

export function useSubscriptionSheet(): SubscriptionSheetContextValue {
  const context = useContext(SubscriptionSheetContext);
  if (!context) {
    throw new Error(
      "useSubscriptionSheet must be used within a SubscriptionSheetProvider",
    );
  }
  return context;
}
