import ProtectedContent from "components/auth/ProtectedContent"
import {appPermissions} from "config/app-permissions.config"
import {PromotionDetail} from "@/components/promotions/detail/PromotionDetail"
import {usePromotionDetail} from "hooks/usePromoDetail"
import {PromotionDetailSkeleton} from "@/components/promotions/detail/PromotionDetailSkeleton"

const ClonePromotionDetailPage = () => {
  const promotionDetailProps = usePromotionDetail()

  if (promotionDetailProps.loading) {
    return <PromotionDetailSkeleton />
  }

  return <PromotionDetail {...promotionDetailProps} />
}

const ProtectedClonePromotionDetailPage = () => {
  return (
    <ProtectedContent hasAccess={appPermissions.PromotionManager}>
      <ClonePromotionDetailPage />
    </ProtectedContent>
  )
}

export default ProtectedClonePromotionDetailPage
