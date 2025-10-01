import React from "react";
import { useTranslation } from "react-i18next";

interface ProductEditFormProps {
  product: {
    knowledge: string;
  };
}

export const ProductEditForm: React.FC<ProductEditFormProps> = ({
  product,
}) => {
  const { t } = useTranslation();

  return (
    <form>
      {/* ...existing form fields... */}

      {/* Show product knowledge as a read-only input field */}
      <input
        type="text"
        value={product.knowledge}
        readOnly
        className="form-input bg-gray-100 border border-gray-300 rounded px-3 py-2 w-full"
        aria-label={t("product_knowledge")}
      />

      {/* ...existing form fields... */}
    </form>
  );
};
