import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useRecoilState, useRecoilValue } from 'recoil'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'
import { useGesture } from '@use-gesture/react'
import { Flip, toast } from 'react-toastify'
import 'swiper/swiper-bundle.css'
import 'swiper/css'
import FeedList from '@/components/feed/FeedList'
import NoFlip from '@/components/main/NoFlip'
import { categoryProps } from '@/components/category/types'
import { StyledToastContainer } from '@/components/toast/toastStyle'
import { FeedProps } from '@/components/feed/types'
import { colors } from '@/styles/colors'
import { getFeedsApi } from '@/apis/AnswerApi'
import { deleteCategoryApi, getCategoriesApi } from '@/apis/CategoryApi'
import { UserInfoStateProps, isMineState, ownerUserData, userInfoState } from '@/context/Atoms'
import Pencil from '@/assets/main/Pencil.svg'
import Trash from '@/assets/main/Trash.svg'
import GroupList from '../category/GroupList'

interface Props {
  username: string | undefined
}

// 메인페이지 피드 컴포넌트
const Feed = ({ username }: Props) => {
  const navigate = useNavigate()

  // 리코일 로그인한 유저 userInfo
  const [userInfo, setUserInfo] = useRecoilState<UserInfoStateProps>(userInfoState)
  // 리코일 계정주인의 userInfo
  const ownerUserInfo = useRecoilValue(ownerUserData)
  // 내 페이지인지 여부 확인
  const isMyPage = useRecoilValue(isMineState)

  // 계정주인 카테고리 리스트 저장
  const [categories, setCategories] = useState<categoryProps[]>([])
  // 계정주인 카테고리 조회
  const getCategories = async () => {
    try {
      await getCategoriesApi(ownerUserInfo.memberId).then((res) => {
        setCategories(res.data.categories)
        // 카테고리가 있을 시 첫 카테고리를 Default로 설정
        if (res.data.categories.length !== 0) {
          setSelectedCategoryId(res.data.categories[0].categoryId)
          setSelectedCategoryImage(res.data.categories[0].categoryImage)
          setSelectedCategoryGroupName(res.data.categories[0].categoryName)
          setSelectedCategoryAnswerIds(res.data.categories[0].answerIds)
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  // 해당 카테고리의 피드 리스트 저장
  const [feedList, setFeedList] = useState<FeedProps[]>([])

  // 클릭하여 선택된 카테고리의 정보 저장
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(-1)
  const [selectedCategoryGroupName, setSelectedCategoryGroupName] = useState<string>('')
  const [selectedCategoryImage, setSelectedCategoryImage] = useState<string>('')
  const [selectedCategoryAnswerIds, setSelectedCategoryAnswerIds] = useState<number[]>([])

  // open은 bottom sheet 모달 열고 닫는 상태
  const [open, setOpen] = useState<boolean>(false)
  const openModal = (categoryId: number, categoryImage: string, categoryName: string, answerIds: number[]) => {
    setSelectedCategoryId(categoryId)
    setSelectedCategoryImage(categoryImage)
    setSelectedCategoryGroupName(categoryName)
    setSelectedCategoryAnswerIds(answerIds)
    setOpen(true)
  }
  // 모달 이전상태로 변화
  const handleDismissPlusMusicModal = () => {
    setOpen(false)
  }
  // 폴더 꾹 눌러 모달창 뜨게하는 기능
  const holdTimer = useRef<number | null>(null)
  const bind = useGesture({
    onPointerDown: ({ event, args }) => {
      const [categoryId, categoryImage, categoryName, answerIds] = args as [number, string, string, number[]]
      event.preventDefault()
      holdTimer.current = window.setTimeout(() => openModal(categoryId, categoryImage, categoryName, answerIds), 500)
    },
    onPointerUp: () => {
      if (holdTimer.current !== null) {
        clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
    },
    onPointerCancel: () => {
      if (holdTimer.current !== null) {
        clearTimeout(holdTimer.current)
        holdTimer.current = null
      }
    },
  })

  // 카테고리 삭제
  const deleteCategory = async () => {
    try {
      await deleteCategoryApi(userInfo.accessToken, selectedCategoryId, userInfo.refreshToken, setUserInfo).then(
        (res: any) => {
          setOpen(false)
          getCategories()
          if (res.status === 204) {
            toast('그룹이 삭제되었습니다')
          }
        },
      )
    } catch (err) {
      console.log(err)
      setOpen(false)
      toast('피드가 있는 그룹은 삭제가 불가능합니다')
    }
  }

  // 카테고리 수정페이지로 이동
  const moveModifyCategory = () => {
    navigate(`/groups/${selectedCategoryId}/edit`, {
      state: {
        categoryId: selectedCategoryId,
        categoryImage: selectedCategoryImage,
        categoryName: selectedCategoryGroupName,
        answerIds: selectedCategoryAnswerIds,
      },
    })
  }
  const [currentPage, setCurrentPage] = useState(0)

  // 해당카테고리에 해당하는 피드리스트 받기
  const getFeeds = useCallback(async () => {
    try {
      await getFeedsApi(ownerUserInfo.memberId, selectedCategoryId, currentPage).then((res) => {
        setFeedList(res.data.content)
      })
    } catch (err) {
      console.log(err)
    }
  }, [selectedCategoryId, username])

  useEffect(() => {
    getCategories()
  }, [username])

  useEffect(() => {
    getFeeds()
  }, [getFeeds])

  return (
    <Container>
      {/* 카테고리 부분 */}
      <GroupList
        categories={categories}
        setCurrentPage={setCurrentPage}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        setSelectedCategoryImage={setSelectedCategoryImage}
        setSelectedCategoryGroupName={setSelectedCategoryGroupName}
        setSelectedCategoryAnswerIds={setSelectedCategoryAnswerIds}
        bind={bind}
        isMyPage={isMyPage}
      />
      {/* 해당 카테고리 피드 리스트 부분 */}
      {feedList.length > 0 ? (
        <FeedList
          data={feedList}
          setFeedList={setFeedList}
          selectedCategoryId={selectedCategoryId}
          selectedCategoryImage={selectedCategoryImage}
          selectedCategoryGroupName={selectedCategoryGroupName}
          selectedCategoryAnswerIds={selectedCategoryAnswerIds}
        />
      ) : (
        <NoFlip />
      )}
      {/* BottomSheet 모달 부분 */}
      {open && (
        <BottomSheet open={open} snapPoints={() => [170]} onDismiss={handleDismissPlusMusicModal} blocking={true}>
          <BottomSheetEachWrapper onClick={moveModifyCategory}>
            <BottomSheetEachIcon src={Pencil} />
            <BottomSheetEachText color={colors.grey1}>그룹 수정하기</BottomSheetEachText>
          </BottomSheetEachWrapper>
          <BottomSheetEachWrapper onClick={deleteCategory}>
            <BottomSheetEachIcon src={Trash} />
            <BottomSheetEachText color="#f00">그룹 삭제하기</BottomSheetEachText>
          </BottomSheetEachWrapper>
        </BottomSheet>
      )}
      <StyledToastContainer
        position="bottom-center"
        autoClose={1000}
        hideProgressBar
        pauseOnHover={false}
        closeOnClick={false}
        closeButton={false}
        rtl={false}
        theme="dark"
        transition={Flip}
      />
    </Container>
  )
}

export default Feed

const Container = styled.div`
  display: flex;
  flex-direction: column;
  /* margin: 20px; */
  gap: 14px;
`

const BottomSheetEachWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  gap: 12px;
  background-color: ${colors.white};
  cursor: pointer;
`
const BottomSheetEachIcon = styled.img`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
`
const BottomSheetEachText = styled.div<{ color: string }>`
  color: ${(props) => props.color};
  font-family: Pretendard;
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.56px;
`
