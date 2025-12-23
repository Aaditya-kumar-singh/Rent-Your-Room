import StripePayment from "@/components/payment/StripePayment";

interface PaymentWrapperProps {
  bookingId: string;
  amount: number;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export default function PaymentWrapper({
  bookingId,
  amount,
  onSuccess,
  onError,
}: PaymentWrapperProps) {
  return (
    <StripePayment
      bookingId={bookingId}
      amount={amount}
      onSuccess={() => onSuccess({ status: "success", method: "stripe" })}
      onError={onError}
    />
  );
}
