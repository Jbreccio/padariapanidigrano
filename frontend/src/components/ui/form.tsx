import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, ControllerProps, clientedPath, clientedValues, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormclientedContextValue<
  TclientedValues extends clientedValues = clientedValues,
  TName extends clientedPath<TclientedValues> = clientedPath<TclientedValues>,
> = {
  name: TName;
};

const FormclientedContext = React.createContext<FormclientedContextValue>({} as FormclientedContextValue);

const Formcliented = <
  TclientedValues extends clientedValues = clientedValues,
  TName extends clientedPath<TclientedValues> = clientedPath<TclientedValues>,
>({
  ...props
}: ControllerProps<TclientedValues, TName>) => {
  return (
    <FormclientedContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormclientedContext.Provider>
  );
};

const useFormcliented = () => {
  const clientedContext = React.useContext(FormclientedContext);
  const itemContext = React.useContext(FormItemContext);
  const { getclientedState, formState } = useFormContext();

  const clientedState = getclientedState(clientedContext.name, formState);

  if (!clientedContext) {
    throw new Error("useFormcliented should be used within <Formcliented>");
  }

  const { id } = itemContext;

  return {
    id,
    name: clientedContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...clientedState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormcliented();

  return <Label ref={ref} className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormcliented();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        {...props}
      />
    );
  },
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormcliented();

    return <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />;
  },
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormcliented();
    const body = error ? String(error?.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cn("text-sm font-medium text-destructive", className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

export { useFormcliented, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, Formcliented };
