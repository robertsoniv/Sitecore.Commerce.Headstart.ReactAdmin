import {
  Button,
  ButtonProps,
  FormControl,
  FormLabel,
  HStack,
  MenuItem,
  MenuItemProps,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  VStack,
  useDisclosure
} from "@chakra-ui/react"
import {FormEvent, useEffect, useState} from "react"
import SubmitButton from "@/components/react-hook-form/submit-button"
import {yupResolver} from "@hookform/resolvers/yup"
import {useForm} from "react-hook-form"
import {array, bool, number, object, string} from "yup"
import {InputControl, SelectControl, SwitchControl} from "@/components/react-hook-form"
import {SpecOptionTable} from "./SpecOptionTable"
import {compact, uniqBy} from "lodash"
import {SpecFieldValues} from "types/form/SpecFieldValues"
import {ISpec} from "types/ordercloud/ISpec"
import {WarrantyOptionTable} from "./WarrantyOptionTable"

const specFormSchema = object().shape({
  Name: string().required(),
  DefinesVariant: bool(),
  Required: bool().when("DefinesVariant", {
    is: true,
    then: (schema) => schema.oneOf([true], "Spec must be required if Defines Variant")
  }),
  Options: array()
    .of(
      object().shape({
        Value: string().required("Option value is required"),
        ListOrder: number(),
        PriceMarkupType: string().oneOf(["NoMarkup", "AmountPerQuantity", "AmountTotal", "Percentage"]).nullable(),
        PriceMarkup: number().nullable()
      })
    )
    .test({
      name: "is-unique-price",
      message: "One or more options have the same value",
      test: (options = []) => compact(uniqBy(options, "Value")).length === options.length
    })
    .min(1, "Must have at least one option")
})

export const warrantySpecFormDefaultValues = {
  Basic: {
    Name: "Basic Warranty",
    DefinesVariant: false,
    Required: false,
    Options: [
      {
        Value: "1 Year Warranty",
        ListOrder: 0,
        PriceMarkupType: "AmountPerQuantity",
        PriceMarkup: 50
      },
      {
        Value: "2 Year Warranty",
        ListOrder: 1,
        PriceMarkupType: "AmountPerQuantity",
        PriceMarkup: 90
      }
    ]
  },
  Electronics: {
    Name: "Electronics Warranty",
    DefinesVariant: false,
    Required: false,
    Options: [
      {
        Value: "1 Year Warranty",
        ListOrder: 0,
        PriceMarkupType: "AmountPerQuantity",
        PriceMarkup: 100
      },
      {
        Value: "2 Year Warranty",
        ListOrder: 1,
        PriceMarkupType: "AmountPerQuantity",
        PriceMarkup: 180
      },
      {
        Value: "3 Year Warranty",
        ListOrder: 2,
        PriceMarkupType: "AmountPerQuantity",
        PriceMarkup: 240
      }
    ]
  },
  Custom: {
    Name: "Custom Warranty",
    DefinesVariant: false,
    Required: false,
    Options: [
      {
        Value: "1 Year Warranty",
        ListOrder: 0,
        PriceMarkupType: "AmountPerQuantity",
        PriceMarkup: 100
      }
    ]
  }
}

interface WarrantySpecUpdateModalProps {
  initialSpec?: SpecFieldValues
  onUpdate: (spec: SpecFieldValues) => void
  as: "button" | "menuitem"
  buttonProps?: ButtonProps
  menuItemProps?: MenuItemProps
}
export function WarrantySpecUpdateModal({
  initialSpec,
  onUpdate,
  as = "button",
  buttonProps,
  menuItemProps
}: WarrantySpecUpdateModalProps) {
  const [warrantyType, setWarrantyType] = useState<string>(initialSpec?.xp?.WarrantyType || "Basic")
  const [spec, setSpec] = useState<SpecFieldValues | null>(initialSpec)
  const {isOpen, onOpen, onClose} = useDisclosure()
  const {handleSubmit, control, trigger, reset} = useForm<SpecFieldValues>({
    mode: "onBlur",
    resolver: yupResolver(specFormSchema) as any,
    defaultValues: spec || warrantySpecFormDefaultValues[warrantyType]
  })

  const warrantyTypeOptions = Object.keys(warrantySpecFormDefaultValues)

  useEffect(() => {
    reset(warrantySpecFormDefaultValues[warrantyType])
  }, [reset, warrantyType])

  const handleSubmitPreventBubbling = (event: FormEvent) => {
    // a version of handleSubmit that prevents
    // the parent form from being submitted
    // which would actually try to save the product (not desired)
    event.preventDefault()
    event.stopPropagation()
    handleSubmit(onSubmit)(event)
  }

  const handleCancel = () => {
    onClose()
  }

  const onSubmit = (update: SpecFieldValues) => {
    onUpdate(update)
    setSpec(initialSpec) // reset spec to initial
    reset(warrantySpecFormDefaultValues["Basic"]) // reset form
    onClose()
  }

  return (
    <>
      {as === "button" ? (
        <Button {...buttonProps} onClick={onOpen}>
          {buttonProps.children || "Add warranty"}
        </Button>
      ) : (
        <MenuItem onClick={onOpen} {...menuItemProps} />
      )}

      <Modal size="5xl" isOpen={isOpen} onClose={handleCancel}>
        <ModalOverlay />
        <ModalContent as="form" noValidate onSubmit={handleSubmitPreventBubbling}>
          <ModalHeader>{spec ? "Edit Warranty" : "Create Warranty"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3}>
              <FormLabel>Type</FormLabel>
              <Select name="WarrantyType" value={warrantyType} onChange={(e) => setWarrantyType(e.target.value)}>
                {warrantyTypeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormControl>
            <VStack align="start" gap={3}>
              <InputControl
                maxWidth="md"
                name="Name"
                label="Name"
                control={control}
                validationSchema={specFormSchema}
              />
              <WarrantyOptionTable control={control} validationSchema={specFormSchema} trigger={trigger} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack justifyContent="space-between" w="100%">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <SubmitButton control={control} variant="solid" colorScheme="primary">
                Submit
              </SubmitButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
