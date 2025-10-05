interface FormMessagesProps {
  error?: string;
  success?: string;
}

export function FormMessages({ error, success }: FormMessagesProps) {
  if (!error && !success) return null;

  return (
    <>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          {success}
        </div>
      )}
    </>
  );
}
