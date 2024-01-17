import React, { useEffect, useRef } from "react";
import TextAreaFormField, { TextAreaFormFieldProps } from "./TextAreaFormField";

type AutoExpandingTextInputFormFieldProps = TextAreaFormFieldProps & {
  id: string;
  maxHeight?: number;
};

const AutoExpandingTextInputFormField = (
  props: AutoExpandingTextInputFormFieldProps
) => {
  const myref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (myref.current == null) return;
    const text = myref.current.textContent?.split("\n");
    const len = (text?.length == 0 ? 1 : text?.length) || 1;
    const height = Math.min(len * 18, (props.maxHeight || 160) - 28) + 28;
    myref.current.style.cssText =
      "min-height:36px; height:46px; height:" + height + "px";
  });

  return <TextAreaFormField ref={myref} {...props} className="w-full" />;
};

export default AutoExpandingTextInputFormField;
