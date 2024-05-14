import { useEffect, useRef } from "react";
import TextAreaFormField, { TextAreaFormFieldProps } from "./TextAreaFormField";

type AutoExpandingTextInputFormFieldProps = TextAreaFormFieldProps & {
  maxHeight?: number;
};

const AutoExpandingTextInputFormField = (
  props: AutoExpandingTextInputFormFieldProps,
) => {
  const myref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (myref.current == null) return;
    const text = myref.current.textContent?.split("\n");
    const len = text?.length || 1;
    // 46 is height of the textarea when there is only 1 line
    // getting line height from window
    const lineHeight =
      window.getComputedStyle(myref.current).lineHeight.slice(0, -2) || "20";
    // added 26 for padding (20+26 = 46)
    const height =
      Math.min(len * parseInt(lineHeight), (props.maxHeight || 160) - 26) + 26;
    // 160 is the max height of the textarea if not specified
    myref.current.style.cssText = "height:" + height + "px";
  });

  return <TextAreaFormField ref={myref} {...props} />;
};

export default AutoExpandingTextInputFormField;
