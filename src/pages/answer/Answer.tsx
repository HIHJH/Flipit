import styled from 'styled-components'
import { useState } from 'react'
import { useRecoilState } from 'recoil'
import { useLocation, useNavigate } from 'react-router-dom'
import heic2any from 'heic2any'
import Question from '@/components/answer/Question'
import { UnFixedButton } from '@/components/common/Button'
import Music from '@/components/answer/Music'
import Link from '@/components/answer/Link'
import DelayModal from '@/components/common/DelayModal'
import Modal from '@/components/common/Modal'
import AnswerHeader from '@/components/common/AnswerHeader'
import { colors } from '@/styles/colors'
import { answerApi } from '@/apis/AnswerApi'
import { userInfoState } from '@/context/Atoms'

// 질문에 대한 답변 페이지
const Answer = () => {
  const navigate = useNavigate()
  // 넘겨 받은 질문 정보 저장
  const location = useLocation()

  const question = location.state?.question
  // 리코일 로그인한 유저정보
  const [userInfo, setUserInfo] = useRecoilState(userInfoState)

  // 이미지 파일 선택 핸들러
  const [imageFile, setImageFile] = useState<File>()
  const [imageUrl, setImageUrl] = useState<string>('')
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files && e.target.files[0]
    if (file) {
      if (file?.name.split('.')[1].toLowerCase() === 'heic') {
        let blob = file
        heic2any({ blob: blob, toType: 'image/jpeg' }).then((resultBlob) => {
          const convertedBlob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob
          file = new File([convertedBlob], file?.name.split('.')[0] + '.jpg', {
            type: 'image/jpeg',
            lastModified: new Date().getTime(),
          })
          setImageUrl(URL.createObjectURL(file))
          setImageFile(file)
        })
      } else {
        setImageUrl(URL.createObjectURL(file))
        setImageFile(file)
      }
    }
  }

  // 텍스트 저장
  const [content, setContent] = useState<string>()
  const onChangeContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)
  }

  // 모달창에서 선택받은 음악 관련 정보, 링크 저장
  const [musicName, setMusicName] = useState<string>('')
  const [musicAudio, setMusicAudio] = useState<string>('')
  const [musicSinger, setMusicSinger] = useState<string>('')
  const [linkAttachments, setLinkAttachments] = useState<string>('')

  // 사진 또는 텍스트 작성없이 답변하려할 때
  const [isOpenDelayModal, setIsOpenDelayModal] = useState(false)
  // 작성 중 뒤로가기를 누를 때
  const [isOpenBackWarningModal, setIsOpenBackWarningModal] = useState(false)

  // 답변하기 버튼 누를 시
  const onClickAnswerBtn = async () => {
    try {
      await answerApi(
        userInfo.accessToken,
        userInfo.memberId,
        imageFile,
        {
          questionId: question.questionId,
          profileOnOff: question.profileOnOff,
          content: content,
          linkAttachments: linkAttachments,
          musicName: musicName,
          musicSinger: musicSinger,
          musicAudioUrl: musicAudio,
          updateImage: true,
        },
        userInfo.refreshToken,
        setUserInfo,
      ).then((res: any) => {
        navigate(`/questions/${question.questionId}/group`, {
          state: {
            answerId: res.data.answerId,
          },
        })
      })
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Container>
      <AnswerHeader func={() => setIsOpenBackWarningModal(true)} text="답변하기" background={colors.grey7} />
      {/* 질문 */}
      <Question question={question} />
      {/* 답변 이미지 */}
      <PolaroidContainer>
        <label htmlFor="file">
          <ProfileWrapper>
            {imageUrl === '' ? <PlusImgText>사진 추가</PlusImgText> : <ProfileImg src={imageUrl} alt="image" />}
          </ProfileWrapper>
        </label>
        <input type="file" name="file" id="file" style={{ display: 'none' }} onChange={handleImageChange} />
        {/* 답변 텍스트 */}
        <AnswerText onChange={onChangeContent} value={content} placeholder="답변을 입력해보세요." />
      </PolaroidContainer>
      {/* 답변 음악 */}
      <Music
        musicName={musicName}
        setMusicName={setMusicName}
        musicAudio={musicAudio}
        setMusicAudio={setMusicAudio}
        musicSinger={musicSinger}
        setMusicSinger={setMusicSinger}
      />
      {/* 답변 링크 */}
      <Link linkAttachments={linkAttachments} setLinkAttachments={setLinkAttachments} />
      <UnFixedButton
        $positive={imageUrl !== '' && content !== '' ? true : false}
        func={() => {
          onClickAnswerBtn()
        }}
        func2={() => {
          {
            imageUrl === '' || content === '' ? setIsOpenDelayModal(true) : console.log('비활성화')
          }
        }}
        text="다음"
        margin="83px 20px 0px 20px"
      />
      {/* 사진 또는 텍스트 작성없이 답변하러 할 때 */}
      {isOpenDelayModal && imageUrl === '' ? (
        <DelayModal setIsOpenDelayModal={setIsOpenDelayModal} text="사진을 추가해주세요!" />
      ) : isOpenDelayModal && content === '' ? (
        <DelayModal setIsOpenDelayModal={setIsOpenDelayModal} text="텍스트를 입력해주세요!" />
      ) : (
        <></>
      )}
      {/* 답변 작성 중 뒤로가기 시 */}
      {isOpenBackWarningModal && (
        <Modal
          content="지금 나가면 작성된 내용은 사라져요. 나가시겠어요?"
          buttonText1="아니요"
          buttonText2="예"
          func1={() => {
            setIsOpenBackWarningModal(false)
          }}
          func2={() => {
            navigate(-1)
          }}
          clickModal={() => {
            setIsOpenBackWarningModal(false)
          }}
        />
      )}
    </Container>
  )
}

export default Answer

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0px 0px 30px 0px;
`
const PolaroidContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  width: 315px;
  height: 346px;
  margin: 20px 0px 0px 0px;
  padding: 18px;
  gap: 18px;
  border-radius: 2px;
  background-color: ${colors.white};
  box-shadow: 0px 4.945px 8.655px 0px rgba(0, 0, 0, 0.1);
`
const ProfileWrapper = styled.div`
  position: relative;
  width: 279px;
  height: 250px;
  flex-shrink: 0;
  border-radius: 2.473px;
  background: ${colors.grey6};
  box-shadow:
    0px 4.945px 8.655px 0px rgba(0, 0, 0, 0.04) inset,
    0px 4.945px 8.655px 0px rgba(0, 0, 0, 0.04) inset;
  cursor: pointer;
`
const ProfileImg = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(50, 50);
  width: 100%;
  height: 100%;
  border-radius: 2.473px;
  object-fit: cover;
  margin: auto;
`
const PlusImgText = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  color: ${colors.grey4};
  font-family: Pretendard;
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.56px;
  cursor: pointer;
`
// 텍스트
const AnswerText = styled.textarea`
  align-self: stretch;
  height: 42px;
  border: none;
  outline: none;
  resize: none;
  flex-shrink: 0;
  color: ${colors.grey1};
  font-family: Pretendard;
  font-size: 14px;
  font-weight: 400;
  line-height: 150%;
  letter-spacing: -0.56px;
  &::placeholder {
    color: ${colors.grey5};
  }
`
