import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useRecoilState, useRecoilValue } from 'recoil'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'
import { useGesture } from '@use-gesture/react'
import { Flip, toast } from 'react-toastify'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/swiper-bundle.css'
import 'swiper/css'
import Feeds from '@/components/feed/Feeds'
import NoFlip from '@/components/main/NoFlip'
import { directoryProps } from '@/components/main/types'
import { StyledToastContainer } from '@/components/toast/toastStyle'
import { colors } from '@/styles/colors'
import { deleteDirectoryApi, getDirectoriesApi } from '@/apis/DirectoryApi'
import { UserInfoStateProps, isMineState, ownerUserData, userInfoState } from '@/context/Atoms'
import Plus from '@/assets/main/Plus.svg'
import Pencil from '@/assets/main/Pencil.svg'
import Trash from '@/assets/main/Trash.svg'
import { getFeedsApi } from '@/apis/AnswerApi'

// 메인페이지 피드 컴포넌트
const Feed = () => {
  const navigate = useNavigate()

  // 리코일 userInfo
  const userInfo = useRecoilValue<UserInfoStateProps>(userInfoState)
  // 리코일 계정주인의 userInfo
  const [ownerUserInfo, setOwnerUserInfo] = useRecoilState(ownerUserData)

  // 내 페이지인지 여부 확인
  const [isMyPage, setIsMyPage] = useRecoilState(isMineState)
  // 유저 디렉토리 리스트 저장
  const [directories, setDirectories] = useState<directoryProps[]>([])
  // 유저 디렉토리 조회
  const getDirectories = async () => {
    try {
      await getDirectoriesApi(ownerUserInfo.memberId).then((res) => {
        console.log(res)
        setDirectories(res.data.categories)
      })
    } catch (err) {
      console.log(err)
    }
  }

  interface FeedProps {
    answerId: number
    questionId: number
    questionContent: string
    memberId: number
    content: string
    linkAttachments: string[]
    musicName: string
    musicSinger: string
    musicAudioUrl: string
    imageUrls: string[]
    createdDate: string
    heartCount: number
    curiousCount: number
    sadCount: number
    fcmtoken: string
  }

  const [feedList, setFeedList] = useState<FeedProps[]>([])

  // 보여줄 선택된 디렉토리
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<number>(0)
  const [selectedDirectoryGroupName, setSelectedDirectoryGroupName] = useState<string>('')
  const [selectedDirectoryImage, setSelectedDirectoryImage] = useState<string>('')
  const [selectedDirectoryAnswerIds, setSelectedDirectoryAnswerIds] = useState<number[]>([])

  // open은 모달 열고 닫는 상태
  const [open, setOpen] = useState<boolean>(false)
  const openModal = (categoryId: number, categoryImage: string, categoryName: string, answerIds: number[]) => {
    setSelectedDirectoryId(categoryId)
    setSelectedDirectoryImage(categoryImage)
    setSelectedDirectoryGroupName(categoryName)
    setSelectedDirectoryAnswerIds(answerIds)
    setOpen(true)
  }
  // 모달 이전상태로 변화
  const handleDismissPlusMusicModal = () => {
    setOpen(false)
  }

  // 폴더 꾹 눌러 모달창 뜨게하는 기능
  const holdTimer = useRef<number | null>(null) // useRef에 타입 명시
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

  // 디렉토리 삭제
  const deleteDirectory = async () => {
    try {
      await deleteDirectoryApi(userInfo.accessToken, selectedDirectoryId).then((res) => {
        setOpen(false)
        getDirectories()
        if (res.status === 204) {
          toast('그룹이 삭제되었습니다')
        }
      })
    } catch (err) {
      console.log(err)
      setOpen(false)
      toast('피드가 있는 그룹은 삭제가 불가능합니다')
    }
  }

  // 디렉토리 수정페이지로 이동
  const moveModifyDirectory = () => {
    navigate(`/groups/${selectedDirectoryId}/edit`, {
      state: {
        categoryId: selectedDirectoryId,
        categoryImage: selectedDirectoryImage,
        categoryName: selectedDirectoryGroupName,
        answerIds: selectedDirectoryAnswerIds,
      },
    })
  }

  useEffect(() => {
    getDirectories()
  }, [])

  const getFeeds = useCallback(async () => {
    try {
      await getFeedsApi(ownerUserInfo.memberId, selectedDirectoryId).then((res) => {
        console.log(res)
        setFeedList(res.data.content)
      })
    } catch (err) {
      console.log(err)
    }
  }, [selectedDirectoryId])

  useEffect(() => {
    getFeeds()
  }, [getFeeds])

  return (
    <Container>
      {/* 디렉토리 부분 */}
      <TopComponent>
        <Swiper
          style={{ width: '100%' }}
          slidesPerView={6.1}
          onSwiper={(swiper) => console.log(swiper)}
          onSlideChange={() => console.log('slide change')}
        >
          {directories.map((item) => {
            return (
              <SwiperSlide key={item.categoryId}>
                <GroupWrapper>
                  <GroupImgWrapper
                    onClick={() => setSelectedDirectoryId(item.categoryId)}
                    selected={selectedDirectoryId === item.categoryId}
                    {...bind(item.categoryId, item.categoryImage, item.categoryName, item.answerIds)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <GroupImg src={item.categoryImage} />
                  </GroupImgWrapper>
                  <GroupName>{item.categoryName}</GroupName>
                </GroupWrapper>
              </SwiperSlide>
            )
          })}
          {isMyPage && (
            <SwiperSlide>
              <GroupWrapper>
                <GroupPlusImg
                  onClick={() => {
                    navigate('/groups/new')
                  }}
                  src={Plus}
                />
                <GroupName>추가</GroupName>
              </GroupWrapper>
            </SwiperSlide>
          )}
        </Swiper>
      </TopComponent>
      {/* 해당 디렉토리 피드 리스트 부분 */}
      {feedList.length > 0 ? <Feeds data={feedList} /> : <NoFlip />}
      {/* BottomSheet 모달 부분 */}
      {open && (
        <BottomSheet open={open} snapPoints={() => [170]} onDismiss={handleDismissPlusMusicModal} blocking={true}>
          <BottomSheetEachWrapper onClick={moveModifyDirectory}>
            <BottomSheetEachIcon src={Pencil} />
            <BottomSheetEachText color={colors.grey1}>그룹 수정하기</BottomSheetEachText>
          </BottomSheetEachWrapper>
          <BottomSheetEachWrapper onClick={deleteDirectory}>
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
  margin: 20px;
  gap: 14px;
`

// 디렉토리
const TopComponent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`
const GroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 44px;
  height: 63px;
  cursor: pointer;
`
const GroupImgWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 3px;
  border-radius: 12px;
  border: ${(props) => (props.selected ? `1px solid ${colors.grey1}` : `1px solid ${colors.grey5}`)};
  background-color: ${colors.white};
  user-select: none;
`
const GroupImg = styled.img`
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 0.8px solid ${colors.grey6};
  background: lightgray 50% / cover no-repeat;
  user-select: none;
  pointer-events: none;
`
const GroupName = styled.div`
  color: ${colors.grey3};
  font-family: Pretendard;
  font-size: 10px;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.4px;
`
const GroupPlusImg = styled.img`
  width: 44px;
  height: 44px;
`

// 모달
const BottomSheetEachWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  gap: 12px;
  background-color: ${colors.white};
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
