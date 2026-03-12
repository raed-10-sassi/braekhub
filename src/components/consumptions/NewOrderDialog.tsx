import { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductWithCategory } from "@/hooks/useProducts";
import { CartItem } from "@/hooks/useOrders";
import { Customer } from "@/hooks/useCustomers";

const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte" },
  { value: "mobile", label: "Paiement mobile" },
  { value: "credits", label: "Crédits" },
];

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductWithCategory[];
  customers: Customer[];
  onConfirm: (data: { customerName: string; paymentMethod: string; items: CartItem[]; customerId?: string }) => void;
  isPending: boolean;
}

export function NewOrderDialog({ open, onOpenChange, products, customers, onConfirm, isPending }: NewOrderDialogProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [search, setSearch] = useState("");

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const isCredits = paymentMethod === "credits";
  const isGuestCredit = isCredits && !customerId;

  const availableProducts = products.filter(
    (p) => p.stock_quantity > 0 && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: ProductWithCategory) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock_quantity }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const willGoNegative = isCredits && selectedCustomer && selectedCustomer.credit_balance < total;
  const canConfirm = cart.length > 0 && (!isCredits || !!customerId || customerName.trim().length > 0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({
      customerName: selectedCustomer?.name || customerName.trim(),
      paymentMethod,
      items: cart,
      customerId: customerId || undefined,
    });
    setCart([]);
    setCustomerName("");
    setCustomerId("");
    setPaymentMethod("cash");
    setSearch("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCart([]);
      setSearch("");
      setCustomerId("");
    }
    onOpenChange(newOpen);
  };

  const handlePaymentChange = (value: string) => {
    setPaymentMethod(value);
    if (value !== "credits") {
      setCustomerId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nouvelle commande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product picker */}
          <div className="space-y-2">
            <Label>Ajouter des articles</Label>
            <Input
              placeholder="Rechercher des produits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ScrollArea className="h-[150px] border rounded-md p-2">
              <div className="space-y-1">
                {availableProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <Badge variant="outline" className="text-xs">{p.product_categories?.name}</Badge>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">Stock : {p.stock_quantity}</span>
                      <span className="font-mono font-bold">{p.price.toFixed(2)} DT</span>
                    </span>
                  </button>
                ))}
                {availableProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Aucun produit disponible</p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <Label>Panier ({cart.length} articles)</Label>
              <div className="border rounded-md divide-y">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product_id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.product_id, 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="font-mono text-sm w-16 text-right">
                        {(item.price * item.quantity).toFixed(2)} DT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">{total.toFixed(2)} DT</span>
              </div>
            </div>
          )}

          {/* Customer & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={handlePaymentChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isCredits ? (
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner ou laisser vide..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} — {c.credit_balance.toFixed(2)} DT
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!customerId && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nom invité (sera auto-enregistré)</Label>
                    <Input
                      placeholder="Nom de l'invité..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                )}
                {selectedCustomer && (
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="h-3 w-3" />
                    <span>Solde : <span className="font-bold">{selectedCustomer.credit_balance.toFixed(2)} DT</span></span>
                    {willGoNegative && (
                      <Badge variant="secondary" className="text-xs">Sera débité des crédits</Badge>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Nom du client (optionnel)</Label>
                <Input
                  placeholder="Invité"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isPending || !canConfirm}
            >
              Confirmer — {total.toFixed(2)} DT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
