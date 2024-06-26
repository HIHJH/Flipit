import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { useRecoilState } from 'recoil'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/common/Header'
import NoFlip from '@/components/main/NoFlip'
import { QuestionProps } from '@/components/question/types'
import Loading from '@/components/common/Loading'
import Modal from '@/components/common/Modal'
import { colors } from '@/styles/colors'
import { deleteQuestionsApi, getQuestionLengthApi, getQuestionsApi } from '@/apis/MainInfoApi'
import { userInfoState } from '@/context/Atoms'
import CloseIcon from '@/assets/main/Close.svg'
import QuotationMark from '@/assets/question/QuotationMark.svg'
import { Flip, toast } from 'react-toastify'
import { StyledToastContainer } from '@/components/toast/toastStyle'

// 답변을 기다리는 질문 리스트 페이지
const QuestionList = () => {
  const navigate = useNavigate()

  // 리코일 로그인 한 유저정보
  const [userData, setUserData] = useRecoilState(userInfoState)
  const myMemberId = userData.memberId
  const accessToken = userData.accessToken

  // 질문 개수
  const [askCount, setAskCount] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true) // 첫 데이터 로딩 상태
  const [scrollLoading, setScrollLoading] = useState<boolean>(true) // 무한스크롤 로딩 상태

  // 질문리스트 저장
  const [questions, setQuestions] = useState<QuestionProps[]>([])
  // 질문리스트 받기
  const getQuestionList = async (page: number) => {
    await getQuestionsApi(myMemberId, page, accessToken, userData.refreshToken, setUserData).then((result) => {
      if (result.length > 0) {
        // 새로운 데이터가 있을 경우
        if (currentPage === 0) {
          // 첫 페이지일 경우 질문 리스트를 초기화
          setQuestions(result)
        } else {
          // 첫 페이지가 아닐 경우 기존 데이터에 추가
          setQuestions((prevData) => [...prevData, ...result])
        }
        setCurrentPage(page + 1)
        if (result.length < 8) {
          // 더 이상 데이터가 없을 경우
          setHasMore(false) // 무한 스크롤 중단
        }
      } else {
        setHasMore(false)
      }
      setLoading(false)
      setScrollLoading(false)
    })
  }
  // 질문 총 개수 받기 (무한 스크롤 때문에 따로 받음)
  const getQuestionNumber = () => {
    getQuestionLengthApi(accessToken, myMemberId, userData.refreshToken, setUserData).then((result) => {
      setAskCount(result)
    })
  }

  useEffect(() => {
    getQuestionNumber()
    getQuestionList(currentPage)
  }, [])

  // 무한스크롤
  const handleScroll = () => {
    const windowHeight = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight
    const body = document.body
    const html = document.documentElement
    const docHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    )
    const windowBottom = windowHeight + window.pageYOffset
    if (windowBottom >= docHeight - 20 && !loading && hasMore && !scrollLoading) {
      setScrollLoading(true)
      getQuestionList(currentPage)
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollLoading, hasMore]) // 스크롤 이벤트 리스너 등록 및 해제

  // 질문자 이름 누르면 실행되는 함수
  const clickName = (active: boolean, nickname: string) => {
    active && navigate(`/${nickname}`)
    !active && toast('질문자가 피드 공개를 설정하지 않았어요!')
  }

  // 삭제 관련 함수
  // 모달 버튼 클릭 유무를 저장할 state
  const [showModal, setShowModal] = useState<boolean>(false)
  // 버튼 클릭시 모달 버튼 클릭 유무를 설정하는 state 함수
  const clickModal = () => setShowModal(!showModal)

  // 질문 삭제
  const [deleteId, setDeleteId] = useState<number>(-1)
  const deleteQuestion = (questionId: number) => {
    deleteQuestionsApi(questionId, accessToken, userData.refreshToken, setUserData).then(() => {
      const updatedQuestions = questions.filter((question) => question.questionId !== questionId)
      setQuestions(updatedQuestions)
      setAskCount(askCount - 1)
      setShowModal(false)
      toast('질문이 삭제되었어요!')
      setTimeout(() => {
        setLoading(true)
        window.location.reload()
      }, 1000)
    })
  }
  const clickDeletion = (questionId: number) => {
    setDeleteId(questionId)
    setShowModal(true)
  }

  if (loading) {
    return <Loading /> // 데이터 로딩 중일 때 로딩 표시
  }

  return (
    <Container>
      <Header route={userData.nickname} text="답변을 기다리는 질문" background={colors.grey7} />
      <Title color={colors.grey1}>
        총 <CountText color={askCount ? colors.grey1 : colors.grey4}>{askCount}개</CountText>
      </Title>
      <ContentWrapper askCount={askCount}>
        {askCount == 0 ? (
          <NoFlip />
        ) : (
          <GridContainer>
            {questions.map((value) => (
              <FlipWrapper
                onClick={() => {
                  navigate(`/questions/${value.questionId}/answer`, {
                    state: {
                      question: value,
                    },
                  })
                }}
                key={value.questionId}
              >
                <DeleteIcon
                  src={CloseIcon}
                  onClick={(event) => {
                    event.stopPropagation()
                    clickDeletion(value.questionId)
                  }}
                />
                <Icon src={QuotationMark} />
                <FlipContent>{value.content}</FlipContent>
                <WriterBlock>
                  FROM{' '}
                  {value.profileOnOff ? (
                    <WriterRegion
                      public={value.profileOnOff ? 1 : 0}
                      onClick={(e) => {
                        e.stopPropagation()
                        clickName(value.profileOnOff, value.senderNickname)
                      }}
                    >
                      {value.nickname}님
                    </WriterRegion>
                  ) : (
                    <WriterRegion
                      public={value.profileOnOff ? 1 : 0}
                      onClick={(e) => {
                        e.stopPropagation()
                        toast('질문자가 피드 공개를 설정하지 않았어요!')
                      }}
                    >
                      {value.nickname}님
                    </WriterRegion>
                  )}
                </WriterBlock>
              </FlipWrapper>
            ))}
          </GridContainer>
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
        {scrollLoading && <div>loading...</div>}
      </ContentWrapper>

      {/* 삭제 누를 시 나오는 모달 */}
      {showModal && (
        <Modal
          content="해당 질문을 삭제하시겠어요?"
          buttonText1="삭제"
          buttonText2="취소"
          func1={() => deleteQuestion(deleteId)}
          func2={clickModal}
          clickModal={clickModal}
        />
      )}
    </Container>
  )
}

export default QuestionList

const Container = styled.div`
  display: flex;
  flex-direction: column;
`
const Title = styled.div`
  display: flex;
  margin: 30px 20px 20px 20px;
  color: ${colors.grey1};
  font-family: Pretendard;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.9px;
`
const CountText = styled.div<{ color: string }>`
  display: flex;
  margin: 0px 0px 0px 6px;
  color: ${(props) => props.color};
  font-family: Pretendard;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.9px;
`
const ContentWrapper = styled.div<{ askCount: number }>`
  padding-top: ${(props) => (props.askCount == 0 ? '80px' : '0px')};
`
const GridContainer = styled.div`
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(2, 1fr);
  gap: 9px;
  margin: 0 20px;
  padding-bottom: 20px;
`
const DeleteIcon = styled.img`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  z-index: 5;
  cursor: pointer;
`
const Icon = styled.img`
  width: 7.72px;
  height: 6.28px;
`
const FlipWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1 0 0;
  height: 179px;
  padding: 30px 10px 10px 10px;
  border-radius: 2px;
  background-color: ${colors.white};
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.08);
`
const FlipContent = styled.div`
  display: flex;
  flex: 1 0 0;
  margin: 18px 0px 0px 0px;
  color: ${colors.grey1};
  font-family: Pretendard;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
  letter-spacing: -0.56px;
`
const WriterBlock = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
  color: ${colors.primary};
  font-family: Pretendard;
  font-size: 10px;
  font-weight: 500;
  line-height: 15px;
  letter-spacing: -0.2px;
`
const WriterRegion = styled.button<{ public: number }>`
  border: none;
  outline: none;
  background-color: transparent;
  color: ${(props) => (props.public ? colors.grey1 : colors.grey4)};
  font-family: Pretendard;
  font-size: 10px;
  font-weight: 500;
  line-height: 15px;
  letter-spacing: -0.2px;
  cursor: 'pointer';
`
