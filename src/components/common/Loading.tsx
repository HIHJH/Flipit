import styled from 'styled-components'
import LoadingIcon from '@/assets/kakaoRedirection/Loading.svg'

// 카카오 로그인 로딩 컴포넌트
const Loading = () => {
  return (
    <Container>
      <Icon src={LoadingIcon} />
      <LoadingText>Loading..</LoadingText>
    </Container>
  )
}

export default Loading
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`

const Icon = styled.img`
  margin: 300px 0px 0px 0px;
  width: 36px;
  height: 36px;
`

const LoadingText = styled.div`
  margin: 18px 0px 0px 0px;
  font-size: 20px;
  font-weight: 600;
`
