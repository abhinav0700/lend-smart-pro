import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_number: z.string().min(10, "Valid contact number is required"),
  address: z.string().optional(),
  id_proof: z.string().optional(),
});

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: any;
}

export const CustomerDialog = ({ open, onClose, customer }: CustomerDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      contact_number: "",
      address: "",
      id_proof: "",
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset(customer);
    } else {
      form.reset({
        name: "",
        contact_number: "",
        address: "",
        id_proof: "",
      });
    }
  }, [customer, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (customer) {
        const { error } = await supabase
          .from("customers")
          .update(values)
          .eq("id", customer.id);

        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        const { error } = await supabase.from("customers").insert([{
          name: values.name,
          contact_number: values.contact_number,
          address: values.address || null,
          id_proof: values.id_proof || null,
          user_id: user.id,
        }]);

        if (error) throw error;
        toast.success("Customer added successfully");
      }

      onClose();
    } catch (error) {
      toast.error("Failed to save customer");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_proof"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Proof (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Aadhaar, PAN, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {customer ? "Update" : "Add"} Customer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
