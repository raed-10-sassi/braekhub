import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Order {
  id: string;
  customer_name: string | null;
  payment_method: string;
  total_amount: number;
  created_at: string;
  created_by: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { products: { name: string } })[];
  profiles: { full_name: string | null } | null;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export function useOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch profile names for created_by
      const userIds = [...new Set(data.filter(o => o.created_by).map(o => o.created_by!))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profiles?.forEach(p => { profileMap[p.id] = p.full_name || "Unknown"; });
      }
      
      return data.map(o => ({
        ...o,
        profiles: o.created_by ? { full_name: profileMap[o.created_by] || null } : null,
      })) as OrderWithItems[];
    },
  });

  const createOrder = useMutation({
    mutationFn: async ({
      customerName,
      paymentMethod,
      items,
      customerId,
    }: {
      customerName: string;
      paymentMethod: string;
      items: CartItem[];
      customerId?: string;
    }) => {
      const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      // If paying with credits and an existing customer is selected, update their credit balance
      if (paymentMethod === "credits" && customerId) {
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("credit_balance")
          .eq("id", customerId)
          .single();

        if (customerError) throw customerError;

        const { error: creditError } = await supabase
          .from("customers")
          .update({ credit_balance: customer.credit_balance + totalAmount })
          .eq("id", customerId);

        if (creditError) throw creditError;
      }

      // Create order
      const { data: { user } } = await supabase.auth.getUser();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName || null,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          customer_id: customerId || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Decrement stock for each product
      for (const item of items) {
        await supabase
          .from("products")
          .update({ stock_quantity: item.stock - item.quantity })
          .eq("id", item.product_id);
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["guest-credits"] });
      toast({ title: "Order placed", description: "Sale has been recorded." });
    },
    onError: (error) => {
      toast({ title: "Error creating order", description: error.message, variant: "destructive" });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      // Delete order items first
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", id);
      if (itemsError) throw itemsError;

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Commande supprimée", description: "La commande a été supprimée avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    orders: ordersQuery.data || [],
    isLoading: ordersQuery.isLoading,
    createOrder,
    deleteOrder,
  };
}
