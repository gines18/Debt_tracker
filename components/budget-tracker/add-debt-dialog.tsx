"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addDebt } from "@/app/actions/debt-budget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { debtNameSchema } from "@/lib/budget-tracker/validation";

type Props = {
  budgetId: string;
  onAdded: () => void;
};

export function AddDebtDialog({ budgetId, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = debtNameSchema.safeParse(name);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid name");
      return;
    }
    setPending(true);
    try {
      await addDebt(budgetId, parsed.data);
      toast.success("Debt added");
      setName("");
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add debt");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          + Add debt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add debt row</DialogTitle>
          <DialogDescription>
            Track another loan or credit balance. New months will include this row automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt-name">Name</Label>
            <Input
              id="debt-name"
              placeholder="e.g. Credit card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Adding…" : "Add debt"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
