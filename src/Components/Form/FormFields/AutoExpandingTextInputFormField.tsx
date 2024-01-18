import React, { useEffect, useRef } from "react";
import TextAreaFormField, { TextAreaFormFieldProps } from "./TextAreaFormField";

type AutoExpandingTextInputFormFieldProps = TextAreaFormFieldProps & {
  maxHeight?: number;
};

const AutoExpandingTextInputFormField = (
  props: AutoExpandingTextInputFormFieldProps
) => {
  const myref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (myref.current == null) return;
    const text = myref.current.textContent?.split("\n");
    const len = text?.length || 1;
    // 28 is the height of the textarea when there is no text
    // 18 is the height of each line
    const height = Math.min(len * 18, (props.maxHeight || 160) - 28) + 28; // 160 is the max height of the textarea if not specified
    myref.current.style.cssText = "height:" + height + "px";
  });

  return <TextAreaFormField ref={myref} {...props} className="w-full" />;
};

export default AutoExpandingTextInputFormField;
