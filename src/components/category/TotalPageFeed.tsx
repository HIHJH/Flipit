import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import styled from 'styled-components'
import { useRecoilValue } from 'recoil'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from 'react-spring-bottom-sheet'
import BackFeedContents from '@/components/feed/BackFeedContents'
import FrontFeedContents from '@/components/feed/FrontFeedContents'
import TelePathyMotion from '@/components/feed/TelepathyMotion'
import { TotalPageFeedProps } from '@/components/category/types'
import { colors } from '@/styles/colors'
import { deleteFeedApi } from '@/apis/AnswerApi'
import { isMineState, userInfoState } from '@/context/Atoms'
import MusicIcon from '@/assets/MusicWhite.svg'
import PlayIcon from '@/assets/PlayGray.svg'
import PauseIcon from '@/assets/PauseGray.svg'
import LinkIcon from '@/assets/LinkWhite.svg'
import pencil from '@/assets/main/Pencil.svg'
import trash from '@/assets/main/Trash.svg'
import Download from '@/assets/category/Download.svg'
import Share from '@/assets/category/Share.svg'
import MoreDot from '@/assets/category/Dot.svg'

// 피드 누를 시 피드 확대 컴포넌트
const TotalPageFeed = (props: TotalPageFeedProps) => {
  const navigate = useNavigate()

  // 선택된 피드
  const selectedFeed = props.selectedFeed
  // 선택된 카테고리
  const selectedCategoryId = props.selectedCategoryId
  const selectedCategoryImage = props.selectedCategoryImage
  const selectedCategoryGroupName = props.selectedCategoryGroupName
  const selectedCategoryAnswerIds = props.selectedCategoryAnswerIds
  const currentAudio = props.currentAudio
  const setCurrentAudio = props.setCurrentAudio
  const isPlaying = props.isPlaying
  const setIsPlaying = props.setIsPlaying

  // 리코일 로그인한 유저의 유저정보
  const userInfo = useRecoilValue(userInfoState)
  // 리코일 내 페이지인지 여부 확인
  const isMyPage = useRecoilValue(isMineState)
  // 어느면을 바라볼지 state
  const [isFlipped, setIsFlipped] = useState<boolean>(false)

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
  // 링크 클릭 시 링크 복사
  const LinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    navigator.clipboard.writeText(selectedFeed?.linkAttachments[0] || 'https://www.flipit.co.kr')
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
  const [giveSee, setGiveSee] = useState<boolean>(false)
  const [giveSad, setGiveSad] = useState<boolean>(false)
  const [giveTelepathy, setGiveTelepathy] = useState<boolean>(false)

  // 통했당 활성화 시 애니메이션
  const clickTelepathy = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    !giveTelepathy && setPopLottie(true)
    setGiveTelepathy(!giveTelepathy)
    setTimeout(() => {
      setPopLottie(false)
    }, 2350)
  }
  const [popLottie, setPopLottie] = useState<boolean>(false)

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

  // 피드 삭제
  const deleteFeed = async () => {
    try {
      await deleteFeedApi(userInfo.accessToken, selectedFeed.answerId).then((res) => {
        console.log(res)
        if (res.status === 204) {
          window.location.reload()
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Container>
      <AnimatePresence>
        {/* 음악,링크,설정 */}
        <TopContents>
          <Links>
            {selectedFeed?.musicName !== '' && (
              <LinkButton onClick={MusicClick}>
                <Icon src={MusicIcon} />
                <OverflowText width="60px">
                  {selectedFeed?.musicName} - {selectedFeed?.musicSinger}
                </OverflowText>
                {props.currentAudio && props.currentAudio.src === selectedFeed.musicAudioUrl && isPlaying ? (
                  <Icon onClick={() => handlePreview(selectedFeed.musicAudioUrl)} src={PauseIcon} alt="pause" />
                ) : (
                  <Icon onClick={() => handlePreview(selectedFeed.musicAudioUrl)} src={PlayIcon} alt="play" />
                )}
              </LinkButton>
            )}
            {selectedFeed?.linkAttachments[0] !== '' && (
              <LinkButton onClick={LinkClick}>
                <Icon src={LinkIcon} />
                <OverflowText width="82px">{selectedFeed?.linkAttachments[0]}</OverflowText>
              </LinkButton>
            )}
          </Links>
          {isMyPage && <Icon src={MoreDot} width={24} height={24} onClick={MoreClick} />}
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
          <EmotionButton
            state={giveHeart}
            onClick={(e) => {
              e.stopPropagation()
              setGiveHeart(!giveHeart)
            }}
          >
            <EmotionText>🖤</EmotionText>
            <EmotionText>{selectedFeed.heartCount}</EmotionText>
          </EmotionButton>
          <EmotionButton
            state={giveSee}
            onClick={(e) => {
              e.stopPropagation()
              setGiveSee(!giveSee)
            }}
          >
            <EmotionText>👀</EmotionText>
            <EmotionText>{selectedFeed.curiousCount}</EmotionText>
          </EmotionButton>
          <EmotionButton
            state={giveSad}
            onClick={(e) => {
              e.stopPropagation()
              setGiveSad(!giveSad)
            }}
          >
            <EmotionText>🥺</EmotionText>
            <EmotionText>{selectedFeed.sadCount}</EmotionText>
          </EmotionButton>
          <TelepathyButton state={giveTelepathy} onClick={clickTelepathy}>
            <EmotionText style={{ fontSize: 20 }}>👉🏻</EmotionText>
            <EmotionText style={{ fontSize: 20 }}>👈🏻</EmotionText>
            <EmotionText>통했당!</EmotionText>
          </TelepathyButton>
        </BottomContents>
      </AnimatePresence>
      {/* ...누를 시 나오는 설정 모달 */}
      {open && (
        <BottomSheet
          open={open}
          snapPoints={() => [353]}
          onDismiss={handleDismiss}
          blocking={true}
          style={{ zIndex: 100 }}
        >
          <BottomSheetEachWrapper>
            <BottomSheetEachIcon src={Share} />
            <BottomSheetEachText color={colors.grey1}>공유하기</BottomSheetEachText>
          </BottomSheetEachWrapper>
          <BottomSheetEachWrapper>
            <BottomSheetEachIcon src={Download} />
            <BottomSheetEachText color={colors.grey1}>저장하기</BottomSheetEachText>
          </BottomSheetEachWrapper>

          <BottomSheetEachWrapper
            onClick={() => {
              navigate(`/groups/${selectedCategoryId}/edit`, {
                state: {
                  categoryId: selectedCategoryId,
                  categoryImage: selectedCategoryImage,
                  categoryName: selectedCategoryGroupName,
                  answerIds: selectedCategoryAnswerIds,
                },
              })
            }}
          >
            <BottomSheetEachIcon src={pencil} />
            <BottomSheetEachText color={colors.grey1}>그룹 수정하기</BottomSheetEachText>
          </BottomSheetEachWrapper>

          <BottomSheetEachWrapper>
            <BottomSheetEachIcon src={pencil} />
            <BottomSheetEachText color={colors.grey1}>플립 수정하기</BottomSheetEachText>
          </BottomSheetEachWrapper>

          <BottomSheetEachWrapper onClick={deleteFeed}>
            <BottomSheetEachIcon src={trash} />
            <BottomSheetEachText color="#f00">플립 삭제하기</BottomSheetEachText>
          </BottomSheetEachWrapper>
        </BottomSheet>
      )}
      {/* 통했당 누를 시 통했당 로띠 애니메이션 */}
      {popLottie && <TelePathyMotion />}
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
