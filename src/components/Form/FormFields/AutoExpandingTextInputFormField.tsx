import { useEffect, useRef } from "react";

import TextAreaFormField, {
  TextAreaFormFieldProps,
} from "@/components/Form/FormFields/TextAreaFormField";

type AutoExpandingTextInputFormFieldProps = TextAreaFormFieldProps & {
  maxHeight?: number;
};

const AutoExpandingTextInputFormField = (
  props: AutoExpandingTextInputFormFieldProps,
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const resizeTextArea = () => {
      if (textareaRef.current == null) return;

      // Reset the height to allow shrink on deleting text
      textareaRef.current.style.height = "auto";

      // Check if the text area is empty, reset to initial height if true
      if (textareaRef.current.value.trim() === "") {
        textareaRef.current.style.height = "initial";
      } else {
        // Calculate new height based on scroll height, considering maxHeight if provided
        const newHeight = Math.min(
          textareaRef.current.scrollHeight,
          props.maxHeight || 160,
        );
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    resizeTextArea();

    // Add an event listener to handle dynamic resizing as user types
    textareaRef.current?.addEventListener("input", resizeTextArea);

    const currentRef = textareaRef.current;

    // Cleanup event listener on component unmount
    return () => {
      currentRef?.removeEventListener("input", resizeTextArea);
    };
  }, [props.maxHeight, props.value]);

  return <TextAreaFormField ref={textareaRef} {...props} />;
};

export default AutoExpandingTextInputFormField;
