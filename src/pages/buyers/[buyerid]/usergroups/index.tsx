import {Box, Button, ButtonGroup, Card, CardBody, CardHeader, Container, HStack} from "@chakra-ui/react"
import {ListPage, UserGroup, UserGroups} from "ordercloud-javascript-sdk"
import {OrderCloudTableColumn, OrderCloudTableFilters} from "components/ordercloud-table"
import {useCallback, useEffect, useMemo, useState} from "react"
import {useErrorToast, useSuccessToast} from "hooks/useToast"
import {DataTable} from "components/data-table/DataTable"
import ExportToCsv from "components/demo/ExportToCsv"
import {IBuyerUserGroup} from "types/ordercloud/IBuyerUserGroup"
import {Link} from "components/navigation/Link"
import React from "react"
import {useRouter} from "hooks/useRouter"

/* This declare the page title and enable the breadcrumbs in the content header section. */
export async function getServerSideProps() {
  return {
    props: {
      header: {
        title: "User groups List",
        metas: {
          hasBreadcrumbs: true,
          hasBuyerContextSwitch: true
        }
      },
      revalidate: 5 * 60
    }
  }
}

const UserGroupsList = () => {
  const [userGroups, setUserGroup] = useState([])
  const router = useRouter()
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()
  const [tableData, setTableData] = useState(null as ListPage<UserGroup>)
  const [filters, setFilters] = useState({} as OrderCloudTableFilters)

  const fetchData = useCallback(
    async (filters: OrderCloudTableFilters) => {
      setFilters(filters)
      const userGroupsList = await UserGroups.List<IBuyerUserGroup>(router.query.buyerid as string, filters)
      setTableData(userGroupsList)
    },
    [router.query.buyerid]
  )

  useEffect(() => {
    fetchData({})
  }, [fetchData])

  const deleteUserGroup = useCallback(
    async (userGroupId: string) => {
      await UserGroups.Delete(router.query.buyerid as string, userGroupId)
      fetchData({})
      successToast({
        description: "Buyer deleted successfully."
      })
    },
    [fetchData, router.query.buyerid, successToast]
  )

  const columnsData = useMemo(
    (): OrderCloudTableColumn<UserGroup>[] => [
      {
        Header: "Name",
        accessor: "Name",
        Cell: ({value, row}) => (
          <Link href={`/buyers/${router.query.buyerid}/usergroups/${row.original.ID}`}>{value}</Link>
        )
      },
      {
        Header: "DESCRIPTION",
        accessor: "Description"
      },
      {
        Header: "ACTIONS",
        Cell: ({row}) => (
          <ButtonGroup>
            <Button
              variant="outline"
              onClick={() => router.push(`/buyers/${router.query.buyerid}/usergroups/${row.original.ID}`)}
            >
              Edit
            </Button>
            <Button variant="outline" onClick={() => deleteUserGroup(row.original.ID)}>
              Delete
            </Button>
          </ButtonGroup>
        )
      }
    ],
    [deleteUserGroup, router]
  )

  return (
    <Container maxW="100%" bgColor="st.mainBackgroundColor" flexGrow={1} p={[4, 6, 8]}>
      <Card>
        <CardHeader display="flex" justifyContent="space-between">
          <ExportToCsv />
          <Button
            onClick={() => router.push(`/buyers/${router.query.buyerid}/usergroups/add`)}
            variant="solid"
            colorScheme="primary"
          >
            Create User Group
          </Button>
        </CardHeader>
        <CardBody>
          <DataTable data={tableData} columns={columnsData} filters={filters} fetchData={fetchData} />
        </CardBody>
      </Card>
    </Container>
  )
}

export default UserGroupsList
