import {useRouter} from "next/router"
import {PromotionAssignment, Promotions, Me} from "ordercloud-javascript-sdk"
import {useState, useEffect, useCallback} from "react"
import {IPromotion} from "types/ordercloud/IPromotion"

export function usePromotionDetail() {
  const [loading, setLoading] = useState(true)
  const {isReady, query} = useRouter()
  const [promotion, setPromotion] = useState({} as IPromotion)
  const [promotionAssignments, setPromotionAssignments] = useState([] as PromotionAssignment[])
  const [defaultOwnerId, setDefaultOwnerId] = useState("")

  const fetchPromotion = useCallback(async (promotionID: string, isCloning: boolean) => {
    const promo = await Promotions.Get<IPromotion>(promotionID)
    if (isCloning) {
      promo.ID = null
      promo.Name = null
      promo.Code = null
    }
    setPromotion(promo)
    return promo
  }, [])

  const fetchPromotionAssignments = useCallback(async (promotionID: string) => {
    const assignments = await Promotions.ListAssignments({promotionID, pageSize: 100})
    const assignmentItems = assignments.Items
    setPromotionAssignments(assignmentItems)
    return assignmentItems
  }, [])

  const fetchDefaultOwnerId = useCallback(async () => {
    const me = await Me.Get()
    const _defaultOwnerId = me.Supplier?.ID || me.Seller?.ID
    setDefaultOwnerId(_defaultOwnerId)
    return _defaultOwnerId
  }, [])

  const getData = useCallback(async () => {
    const promotionID = query.promotionid?.toString()
    const cloneID = query.cloneid?.toString()
    const requests: any[] = []
    if (promotionID || cloneID) {
      requests.push(fetchPromotion(promotionID || cloneID, !!cloneID))
      requests.push(fetchPromotionAssignments(promotionID || cloneID))
    } else {
      requests.push(fetchDefaultOwnerId())
    }
    await Promise.all(requests)
  }, [query.promotionid, query.cloneid, fetchPromotion, fetchPromotionAssignments, fetchDefaultOwnerId])

  useEffect(() => {
    const initializeData = async () => {
      await getData()
      setLoading(false)
    }

    if (isReady) {
      initializeData()
    }
  }, [isReady, getData])

  return {
    // powers loading indicator
    loading,

    // promo detail data
    promotion,
    promotionAssignments,
    defaultOwnerId,

    // promo detail actions
    fetchPromotion,
    fetchPromotionAssignments,
    fetchDefaultOwnerId
  }
}
