import {Button, Card, CardBody, CardHeader, HStack, Heading} from "@chakra-ui/react"
import {groupBy} from "lodash"
import {ILineItem} from "types/ordercloud/ILineItem"
import {ISupplier} from "types/ordercloud/ISupplier"
import {LineItemTable} from "./LineItemTable"
import {ShipFromAddressMap} from "hooks/useOrderDetail"
import {SingleLineAddress} from "../SingleLineAddress"
import {useState} from "react"
import {LineItems, Orders} from "ordercloud-javascript-sdk"

interface OrderProductsProps {
  orderId?: string
  isAdmin?: boolean
  isOrderAwaitingApproval?: boolean
  lineItems: ILineItem[]
  suppliers: ISupplier[]
  shipFromAddresses: ShipFromAddressMap
  refreshOrderAndLines?: () => void
}
export function OrderProducts({
  orderId,
  isAdmin,
  isOrderAwaitingApproval,
  lineItems,
  suppliers,
  shipFromAddresses,
  refreshOrderAndLines
}: OrderProductsProps) {
  const [lines, setLines] = useState<ILineItem[]>(lineItems)
  const [hasChanges, setHasChanges] = useState(false)
  const [loadingChanges, setLoadingChanges] = useState(false)
  if (!isAdmin) {
    return <LineItemTable lineItems={lineItems} />
  }
  const groupedByShipFrom = groupBy(lines, (li) => li.Product.DefaultSupplierID + li.ShipFromAddressID)

  const handleLineItemChange = (updatedLines: ILineItem[]) => {
    setLines(updatedLines)
    setHasChanges(true)
  }

  const handleLineItemUpdate = async () => {
    try {
      setLoadingChanges(true)
      const diff = lines.filter((li) => {
        const original = lineItems.find((l) => l.ID === li.ID)
        return original.Quantity !== li.Quantity || original.UnitPrice !== li.UnitPrice
      })
      await Promise.all(
        diff.map((li) => LineItems.Patch("All", orderId, li.ID, {Quantity: li.Quantity, UnitPrice: li.UnitPrice}))
      )
      await Orders.Patch("All", orderId, {xp: {SellerApproved: true}})
      await refreshOrderAndLines()
    } finally {
      setHasChanges(false)
      setLoadingChanges(false)
    }
  }

  return (
    <>
      {hasChanges && (
        <HStack justifyContent="flex-end">
          <Button
            mb={3}
            variant="solid"
            colorScheme="primary"
            onClick={handleLineItemUpdate}
            isLoading={loadingChanges}
            isDisabled={loadingChanges}
          >
            Save changes
          </Button>
        </HStack>
      )}
      {Object.values(groupedByShipFrom).map((shipFromLineItems) => {
        const shipFromAddressId = shipFromLineItems[0].ShipFromAddressID
        const supplierId = shipFromLineItems[0].Product?.DefaultSupplierID
        return (
          <SupplierLineItems
            isOrderAwaitingApproval={isOrderAwaitingApproval}
            onLineItemChange={handleLineItemChange}
            key={supplierId + shipFromAddressId}
            supplierId={supplierId}
            shipFromAddressId={shipFromAddressId}
            suppliers={suppliers}
            shipFromAddresses={shipFromAddresses}
            lineItems={shipFromLineItems}
          />
        )
      })}
    </>
  )
}

interface SupplierLineItemsProps {
  isOrderAwaitingApproval?: boolean
  onLineItemChange: (lineItems: ILineItem[]) => void
  supplierId?: string
  shipFromAddressId: string
  suppliers: ISupplier[]
  lineItems: ILineItem[]
  shipFromAddresses: ShipFromAddressMap
}
function SupplierLineItems({
  isOrderAwaitingApproval,
  onLineItemChange,
  supplierId,
  shipFromAddressId,
  suppliers,
  shipFromAddresses,
  lineItems
}: SupplierLineItemsProps) {
  const supplier = suppliers.find((supplier) => supplier.ID === supplierId)
  const address = shipFromAddresses[supplierId] ? shipFromAddresses[supplierId][shipFromAddressId] : null
  return (
    <Card marginBottom={5} backgroundColor="st.mainBackgroundColor">
      <CardHeader>
        <Heading size="sm">{supplier?.Name || "Admin"}</Heading>
        {address && <SingleLineAddress address={address} />}
      </CardHeader>
      <CardBody>
        <LineItemTable lineItems={lineItems} isEditable={isOrderAwaitingApproval} onLineItemChange={onLineItemChange} />
      </CardBody>
    </Card>
  )
}
