import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { useRecoilState, useRecoilValue } from 'recoil'
import { Flip, toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'
import { BottomSheet } from 'react-spring-bottom-sheet'
import html2canvas from 'html2canvas'
import debounce from 'lodash/debounce'
import BackFeedContents from '@/components/feed/BackFeedContents'
import FrontFeedContents from '@/components/feed/FrontFeedContents'
import { TotalPageFeedProps } from '@/components/category/types'
import { StyledToastContainer } from '@/components/toast/toastStyle'
import { colors } from '@/styles/colors'
import { deleteFeedApi, getIsReactedApi, getReactCountApi, postReactApi } from '@/apis/AnswerApi'
import { isLoggedInState, isMineState, ownerUserData, userInfoState } from '@/context/Atoms'
import MusicIcon from '@/assets/MusicWhite.svg'
import PlayIcon from '@/assets/PlayGray.svg'
import PauseIcon from '@/assets/PauseGray.svg'
import LinkIcon from '@/assets/LinkWhite.svg'
import pencil from '@/assets/main/Pencil.svg'
import trash from '@/assets/main/Trash.svg'
import Download from '@/assets/category/Download.svg'
import Share from '@/assets/category/Share.svg'
import MoreDot from '@/assets/category/Dot.svg'
import LoginModal from '../question/LoginModal'

declare global {
  interface Window {
    Kakao: any
  }
}

// 피드 누를 시 피드 확대 컴포넌트
const TotalPageFeed = (props: TotalPageFeedProps) => {
  const navigate = useNavigate()

  // 선택된 피드
  const selectedFeed = props.selectedFeed
  // 화면캡쳐위한
  const selectedFeedId = `captureTarget${selectedFeed.answerId}`
  // 선택된 카테고리
  const { currentAudio, setCurrentAudio, isPlaying, setIsPlaying } = props

  // 로그인 여부
  const isLoggedIn = useRecoilValue(isLoggedInState)
  // 모달 버튼 클릭 유무를 저장할 state (로그인 안했을 시 나오는 모달)
  const [showModal, setShowModal] = useState<boolean>(false)
  // 버튼 클릭시 모달 버튼 클릭 유무를 설정하는 state 함수
  const clickModal = () => setShowModal(!showModal)

  // 리코일 로그인한 유저의 유저정보
  const [userInfo, setUserInfo] = useRecoilState(userInfoState)
  // 리코일 내 페이지인지 여부 확인
  const isMyPage = useRecoilValue(isMineState)
  // 어느면을 바라볼지 state
  const [isFlipped, setIsFlipped] = useState<boolean>(false)

  // 모달 밖 클릭 시
  const backModal = () => {
    // 모달 내릴 때 오디오 끄기
    if (isPlaying) {
      currentAudio?.pause()
      setIsPlaying(false)
      setOpen(false)
    } else {
      setOpen(false)
    }
  }

  const spring = {
    type: 'spring',
    stiffness: 300,
    damping: 40,
  }
  // 플립 뒤집기
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsFlipped((prevState) => !prevState)
  }
  // 음악 클릭 시 30초 미리듣기
  const MusicClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    handlePreview(selectedFeed.musicAudioUrl)
  }

  // 계정 주인일때 ...누를 시 bottom sheet 나오도록
  const [open, setOpen] = useState<boolean>(false)
  const MoreClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setOpen(!open)
  }
  const handleDismiss = () => {
    setOpen(false)
  }

  // 공감 누른지 여부
  const [giveHeart, setGiveHeart] = useState<boolean>(false)
  const [giveCurious, setGiveCurious] = useState<boolean>(false)
  const [giveSad, setGiveSad] = useState<boolean>(false)
  const [giveTelepathy, setGiveTelepathy] = useState<boolean>(false)

  //트랙 미리듣기 (한번에 여러개의 오디오가 드리지 않게 설정)
  const handlePreview = (previewUrl: string) => {
    if (currentAudio && currentAudio.src === previewUrl) {
      // 이미 실행 중인 노래의 버튼을 다시 누르면 일시 중지/재생 토글
      if (isPlaying) {
        currentAudio.pause()
      } else {
        currentAudio.play()
      }
      setIsPlaying(!isPlaying)
    } else {
      // 다른 노래의 버튼을 누르면 기존 노래 중지 후 새로운 노래 재생
      if (currentAudio) {
        currentAudio.pause()
      }
      const audio = new Audio(previewUrl)
      setCurrentAudio(audio)
      audio.play()
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause()
        setIsPlaying(false)
      }
    }
  }, [currentAudio])

  // 피드 삭제
  const deleteFeed = async () => {
    try {
      await deleteFeedApi(userInfo.accessToken, selectedFeed.answerId, userInfo.refreshToken, setUserInfo).then(
        (res: any) => {
          if (res.status === 204) {
            // var categoryIdValue = 'yourCategoryId' // 여기에 categoryId 값을 할당합니다.
            // var currentPageUrl = window.location.href
            // var stateObject = { page: '/groups', categoryId: categoryIdValue }
            // window.history.replaceState(stateObject, '', currentPageUrl)
            window.location.reload()
            toast('플립이 삭제되었습니다!')
          }
        },
      )
    } catch (err) {
      console.log(err)
    }
  }

  // 반응 count
  const [heartCount, setHeartCount] = useState<number>(0)
  const [curiousCount, setCuriousCount] = useState<number>(0)
  const [sadCount, setSadCount] = useState<number>(0)
  const [connectCount, setConnectCount] = useState<number>(0)

  // 해당 피드에 대한 반응 여부 / 개수 확인
  const fetchReactionData = useCallback(async () => {
    try {
      const reactedRes = await getIsReactedApi(
        userInfo.accessToken,
        selectedFeed.answerId,
        userInfo.memberId,
        userInfo.refreshToken,
        setUserInfo,
      )
      setGiveHeart(reactedRes?.data?.HEART ?? false)
      setGiveCurious(reactedRes?.data?.CURIOUS ?? false)
      setGiveSad(reactedRes?.data?.SAD ?? false)
      setGiveTelepathy(reactedRes?.data?.CONNECT ?? false)

      const countRes = await getReactCountApi(selectedFeed.answerId)
      setHeartCount(countRes.data.heartCount)
      setCuriousCount(countRes.data.curiousCount)
      setSadCount(countRes.data.sadCount)
      setConnectCount(countRes.data.connectCount)
    } catch (err) {
      console.log(err)
    }
  }, [selectedFeed])

  // 해당피드에 반응 남기기
  const postReact = debounce(async (reaction: string) => {
    try {
      const res = (await postReactApi(
        userInfo.accessToken,
        selectedFeed.answerId,
        userInfo.memberId,
        reaction,
        userInfo.refreshToken,
        setUserInfo,
      )) ?? { data: {} }
      setHeartCount(res.data.heartCount ?? 0)
      setCuriousCount(res.data.curiousCount ?? 0)
      setSadCount(res.data.sadCount ?? 0)
      setConnectCount(res.data.connectCount ?? 0)

      if (reaction === 'HEART') setGiveHeart(res.data.clicked ?? false)
      else if (reaction === 'CURIOUS') setGiveCurious(res.data.clicked ?? false)
      else if (reaction === 'SAD') setGiveSad(res.data.clicked ?? false)
      else if (reaction === 'CONNECT') {
        if (!giveTelepathy) props.setPopLottie(true)
        setTimeout(() => props.setPopLottie(false), 2350)
        setGiveTelepathy(res.data.clicked ?? false)
      }
    } catch (err) {
      console.error(err)
    }
  }, 300)

  useEffect(() => {
    fetchReactionData()
    return () => postReact.cancel()
  }, [fetchReactionData])

  const handleReact = (e: React.MouseEvent, reaction: string) => {
    e.stopPropagation()
    isLoggedIn ? postReact(reaction) : setShowModal(true)
  }

  // 캡쳐된 이미지 저장
  const [, setCapturedImageData] = useState<string>('')
  // 캡쳐된 이미지 파일으로 저장
  const [, setImageFile] = useState<File | null>(null)

  // 화면캡쳐하기
  const captureElement = async (elementId: string): Promise<string> => {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Element not found')
    const canvas = await html2canvas(element, {
      backgroundColor: 'rgba(0,0,0,0.1)',
    })
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl
  }

  const downloadElement = async (elementId: string) => {
    const element = document.getElementById(elementId)
    if (!element) throw new Error('Element not found')
    const canvas = await html2canvas(element, {
      backgroundColor: 'rgba(0,0,0,0.1)',
    })
    const link = document.createElement('a')
    link.download = 'capture.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  // 공유하기 누를 시
  const handleShareCapturedImage = async () => {
    const dataUrl = await captureElement(selectedFeedId)
    setCapturedImageData(dataUrl)
    convertDataURLToFile(dataUrl, 'captured-image.png')
  }

  // 저장하기 누를시
  const handleDownloadCapturedImage = async () => {
    downloadElement(selectedFeedId)
  }

  // 카카오 공유 시 captureElement로 만든 이미지 url은 사용 불가 -> 해당 url다시 파일로 바꿔줘서 카카오 서버에 올리기 -> 카카오 서버 url가져와서 공유
  const convertDataURLToFile = (dataUrl: string, filename: string): void => {
    const arr = dataUrl.split(',')
    const match = arr[0].match(/:(.*?);/)
    if (!match) {
      console.error('Failed to extract MIME type from data URL.')
      return
    }
    const mime = match[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }

    const blob = new Blob([u8arr], { type: mime })
    const file = new File([blob], filename, { type: mime })
    setImageFile(file) // 파일 객체 상태 업데이트
    if (file) shareKakao(file)
  }

  // 리코일 계정 주인의 데이터 정보
  const [ownerUserInfo] = useRecoilState(ownerUserData)

  // 공유
  const { Kakao } = window
  const javascriptKey: string = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
  const realUrl: string = import.meta.env.VITE_CLIENT_URL

  useEffect(() => {
    // init 해주기 전에 clean up 을 해준다.
    Kakao.cleanup()
    Kakao.init(javascriptKey)
    // 잘 적용되면 true
  }, [])

  // 카카오로 공유
  const shareKakao = (file: File) => {
    Kakao.Share.uploadImage({
      file: [file],
    })
      .then(function (response: any) {
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `${ownerUserInfo.nickname}님의 플립을 공유했어요!`,
            description: `플립을 뒤집어 ${ownerUserInfo.nickname}님의 답변을 확인해 보세요!`,
            imageUrl: response.infos.original.url,
            link: {
              webUrl: `${realUrl}/${ownerUserInfo.nickname}`,
              mobileWebUrl: `${realUrl}/${ownerUserInfo.nickname}`,
            },
          },
          buttons: [
            {
              title: '플립 보러가기',
              link: {
                webUrl: `${realUrl}/${ownerUserInfo.nickname}`,
                mobileWebUrl: `${realUrl}/${ownerUserInfo.nickname}`,
              },
            },
          ],
        })
      })
      .catch(function (error: any) {
        console.log(error)
      })
  }

  const [absoluteLink, setAbsoluteLink] = useState<string>('')
  // selectedFeed 값이 변경될 때마다 절대 경로를 업데이트합니다.
  useEffect(() => {
    if (selectedFeed && selectedFeed.linkAttachments) {
      let absolutePath
      // 만약 selectedFeed.linkAttachments가 URL 형식이 아니라면 처리
      if (!selectedFeed.linkAttachments.startsWith('http')) {
        absolutePath = `https://${selectedFeed.linkAttachments}`
      } else {
        absolutePath = selectedFeed.linkAttachments
      }
      setAbsoluteLink(absolutePath)
    }
  }, [selectedFeed])

  return (
    <Container>
      <AnimatePresence>
        <div id={selectedFeedId}>
          {/* 음악,링크,설정 */}
          <TopContents>
            <Links>
              {selectedFeed?.musicName !== '' && (
                <LinkButton onClick={MusicClick}>
                  <Icon src={MusicIcon} />
                  <OverflowText width="60px">
                    {selectedFeed?.musicName} - {selectedFeed?.musicSinger}
                  </OverflowText>
                  {selectedFeed.musicAudioUrl === '' ? (
                    <></>
                  ) : props.currentAudio && props.currentAudio.src === selectedFeed.musicAudioUrl && isPlaying ? (
                    <Icon src={PauseIcon} alt="pause" />
                  ) : (
                    <Icon src={PlayIcon} alt="play" />
                  )}
                </LinkButton>
              )}
              {selectedFeed?.linkAttachments !== '' && (
                <Link to={absoluteLink} style={{ textDecoration: 'none' }}>
                  <LinkButton>
                    <Icon src={LinkIcon} />
                    <OverflowText width="82px">{selectedFeed?.linkAttachments}</OverflowText>
                  </LinkButton>
                </Link>
              )}
            </Links>
            <Icon src={MoreDot} width={24} height={24} onClick={MoreClick} />
          </TopContents>
          {/* 피드 */}
          <ModalWrapper onClick={handleClick} transition={spring}>
            <CardWrapper
              animate={{ rotateY: isFlipped ? -180 : 0 }}
              transition={spring}
              style={{ zIndex: isFlipped ? 0 : 1 }}
            >
              {/* 앞면 질문 */}
              <FrontFeedContents selectedFeed={selectedFeed} />
            </CardWrapper>
            <CardWrapper
              initial={{ rotateY: 180 }}
              animate={{ rotateY: isFlipped ? 0 : 180 }}
              transition={spring}
              style={{
                zIndex: isFlipped ? 1 : 0,
              }}
            >
              {/* 뒷면 답변*/}
              <BackFeedContents selectedFeed={selectedFeed} />
            </CardWrapper>
          </ModalWrapper>
          {/* 반응 */}
          <BottomContents>
            <EmotionButton state={giveHeart} onClick={(e) => handleReact(e, 'HEART')}>
              <EmotionText>🖤</EmotionText>
              <EmotionText>{heartCount}</EmotionText>
            </EmotionButton>
            <EmotionButton state={giveCurious} onClick={(e) => handleReact(e, 'CURIOUS')}>
              <EmotionText>👀</EmotionText>
              <EmotionText>{curiousCount}</EmotionText>
            </EmotionButton>
            <EmotionButton state={giveSad} onClick={(e) => handleReact(e, 'SAD')}>
              <EmotionText>🥺</EmotionText>
              <EmotionText>{sadCount}</EmotionText>
            </EmotionButton>
            <TelepathyButton state={giveTelepathy} onClick={(e) => handleReact(e, 'CONNECT')}>
              <EmotionText style={{ fontSize: 20 }}>👉🏻</EmotionText>
              <EmotionText style={{ fontSize: 20, opacity: giveTelepathy ? 1 : 0.3 }}>👈🏻</EmotionText>
              <EmotionText>{isMyPage ? connectCount : '통했당!'}</EmotionText>
            </TelepathyButton>
          </BottomContents>
          {open && isMyPage && (
            <BottomSheet
              open={open}
              snapPoints={() => [353]}
              onDismiss={handleDismiss}
              blocking={true}
              style={{ zIndex: 100 }}
            >
              <BottomSheetEachWrapper onClick={handleShareCapturedImage}>
                <BottomSheetEachIcon src={Share} />
                <BottomSheetEachText color={colors.grey1}>공유하기</BottomSheetEachText>
              </BottomSheetEachWrapper>
              <BottomSheetEachWrapper onClick={handleDownloadCapturedImage}>
                <BottomSheetEachIcon src={Download} />
                <BottomSheetEachText color={colors.grey1}>저장하기</BottomSheetEachText>
              </BottomSheetEachWrapper>

              <BottomSheetEachWrapper
                onClick={() => {
                  navigate(`/questions/${selectedFeed.questionId}/groups/edit`, {
                    state: {
                      answerId: selectedFeed.answerId,
                    },
                  })
                  backModal()
                }}
              >
                <BottomSheetEachIcon src={pencil} />
                <BottomSheetEachText color={colors.grey1}>그룹 수정하기</BottomSheetEachText>
              </BottomSheetEachWrapper>

              <BottomSheetEachWrapper
                onClick={() => {
                  navigate(`/questions/${selectedFeed.questionId}/edit`, {
                    state: {
                      question: {
                        questionId: selectedFeed.questionId,
                        content: selectedFeed.questionContent,
                        nickname: selectedFeed.nickname,
                        profileOnOff: selectedFeed.profileOnOff,
                      },
                      selectedFeed: selectedFeed,
                    },
                  })
                  backModal()
                }}
              >
                <BottomSheetEachIcon src={pencil} />
                <BottomSheetEachText color={colors.grey1}>플립 수정하기</BottomSheetEachText>
              </BottomSheetEachWrapper>

              <BottomSheetEachWrapper onClick={deleteFeed}>
                <BottomSheetEachIcon src={trash} />
                <BottomSheetEachText color="#f00">플립 삭제하기</BottomSheetEachText>
              </BottomSheetEachWrapper>
            </BottomSheet>
          )}
          {open && !isMyPage && (
            <BottomSheet
              open={open}
              snapPoints={() => [170]}
              onDismiss={handleDismiss}
              blocking={true}
              style={{ zIndex: 100 }}
            >
              <BottomSheetEachWrapper onClick={handleShareCapturedImage}>
                <BottomSheetEachIcon src={Share} />
                <BottomSheetEachText color={colors.grey1}>공유하기</BottomSheetEachText>
              </BottomSheetEachWrapper>
              <BottomSheetEachWrapper onClick={handleDownloadCapturedImage}>
                <BottomSheetEachIcon src={Download} />
                <BottomSheetEachText color={colors.grey1}>저장하기</BottomSheetEachText>
              </BottomSheetEachWrapper>
            </BottomSheet>
          )}
        </div>
      </AnimatePresence>
      {/* 로그인 안하고 질문 시 나오는 모달 */}
      {showModal && <LoginModal content={`앗!\n로그인을 해야 반응을 남길 수 있어요😥`} clickModal={clickModal} />}

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

export default TotalPageFeed

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ModalWrapper = styled(motion.div)`
  width: 315px;
  height: 346px;
  perspective: 1200px;
  transform-style: preserve-3d;
  z-index: 1;
  background-color: transparent;
  padding: 0;
`
const CardWrapper = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
`
const TopContents = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 315px;
  margin-bottom: 8px;
  margin-top: 20px;
`
const Links = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
`
const LinkButton = styled.div`
  display: flex;
  align-items: center;
  width: 120px;
  padding: 4px 8px;
  gap: 8px;
  border-radius: 100px;
  background-color: ${colors.grey1};
  cursor: pointer;
`
const Icon = styled.img`
  cursor: pointer;
`
const OverflowText = styled.div<{ width: string }>`
  width: ${(props) => props.width};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${colors.white};
  font-family: Pretendard;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: -0.2px;
`
const BottomContents = styled.div`
  display: flex;
  flex-direction: row;
  width: 315px;
  gap: 6px;
  margin-top: 8px;
  margin-bottom: 20px;
`
const EmotionButton = styled.div<{ state: boolean }>`
  display: flex;
  align-items: center;
  height: 30px;
  padding: 4px 8px;
  gap: 4px;
  border-radius: 100px;
  background: ${(props) => (props.state ? colors.green : colors.white)};
  cursor: pointer;
`
const TelepathyButton = styled.div<{ state: boolean }>`
  display: flex;
  align-items: center;
  height: 30px;
  padding: 4px 12px;
  gap: 4px;
  border-radius: 100px;
  background: ${(props) => (props.state ? colors.primary : colors.white)};
  cursor: pointer;
`
const EmotionText = styled.div`
  color: ${colors.grey1};
  font-family: Pretendard;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  letter-spacing: -0.24px;
`
const BottomSheetEachWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  gap: 12px;
  background: ${colors.white};
  z-index: 100;
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
