import {ChevronDownIcon} from "@chakra-ui/icons"
import {Button, HStack, Menu, MenuButton, MenuItemOption, MenuList, MenuOptionGroup, Text, Tag} from "@chakra-ui/react"
import {FC, useCallback, useEffect, useState} from "react"
import {CostCenter, CostCenters} from "ordercloud-javascript-sdk"

interface ICostCenterStatusFilter {
  value: string
  onChange: (newValue: any) => void
}

const OrderStatusFilter: FC<ICostCenterStatusFilter> = ({value = "", onChange}) => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])

  const getCostCenters = useCallback(async () => {
    const costCenters = await CostCenters.List("EducationBuyer")
    setCostCenters(costCenters.Items)
  }, [])

  useEffect(() => {
    getCostCenters()
  }, [getCostCenters])

  return (
    <Menu>
      <MenuButton as={Button} py={0} variant="outline" minW="auto">
        <HStack alignContent="center" h="100%">
          <Text>Cost Center</Text>
          <Tag colorScheme="default">{costCenters.find((c) => c.ID === value)?.Name || "Any"}</Tag>
          <ChevronDownIcon />
        </HStack>
      </MenuButton>
      <MenuList>
        <MenuOptionGroup defaultValue={value} title="Filter by Cost Center" type="radio" onChange={onChange}>
          <MenuItemOption value="">Any</MenuItemOption>
          {costCenters?.map((c) => (
            <MenuItemOption key={c.ID} value={c.ID}>
              {c.Name}
            </MenuItemOption>
          ))}
        </MenuOptionGroup>
      </MenuList>
    </Menu>
  )
}

export default OrderStatusFilter
