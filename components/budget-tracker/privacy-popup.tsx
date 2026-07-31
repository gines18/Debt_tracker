"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISMISSED_KEY = "privacy-popup-dismissed";

export function PrivacyPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setOpen(true);
    }
  }, []);

  function handleDismiss() {
    setOpen(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your data stays with you</DialogTitle>
          <DialogDescription>
            This website does not collect any data. Your budgets, debts, and
            entries are stored only in your own Supabase account and are never
            shared with third parties.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-2">
          <Button onClick={handleDismiss}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}