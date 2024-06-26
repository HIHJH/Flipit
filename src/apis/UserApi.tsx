import { flipitAxios, postRefreshToken } from './apis'

const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI

// 인가코드를 통해 카카오에 등록된 유저정보 받기
export const getKakaoUserInfoApi = (code: string) => {
  let API = `/oauth/kakao/callback?code=${code}&redirectUri=${redirectUri}`
  return flipitAxios.get(API)
}

// 카카오 어세스토큰을 통하여 회원가입 여부 확인
export const isExistingAccountApi = (accessToken: string) => {
  let API = `/api/auth/isExisting`
  return flipitAxios.get(API, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

// 존재하는 닉네임인지 여부확인
export const isExistingNicknameApi = (nickname: string) => {
  let API = `/api/auth/nickname/isExisting?nickname=${nickname}`
  return flipitAxios.get(API)
}

// 카카오 어세스토큰을 통하여 jwt토큰 받기
export const loginApi = (accessToken: string, nickname: string) => {
  let API = `/api/auth/login`
  return flipitAxios.post(
    API,
    { memberType: 'KAKAO', nickname: nickname },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
}

// 유저 정보 받기
export const getUserInfoApi = (accessToken: string, memberId: number) => {
  let API = `/api/member/${memberId}`
  return flipitAxios.get(API, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

// 유저 프로필 사진 업데이트
export const updateUserProfileApi = async (
  accessToken: string,
  memberId: number,
  imageFile: File,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    // FormData 객체 생성
    const formData = new FormData()
    // 이미지 파일을 'profileImage' 키로 추가
    formData.append('image', imageFile)

    let API = `/api/member/profile-image/${memberId}`
    // PATCH 요청
    return flipitAxios.patch(API, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // 컨텐츠 타입을 multipart/form-data로 지정
      },
    })
  }
  try {
    return await makeRequest(accessToken)
  } catch (error: any) {
    console.error(error)
    if (error.response.data.errorCode === 'T-001') {
      const newAccessToken = await postRefreshToken(refreshToken, setUserInfo)
      return await makeRequest(newAccessToken)
    }
  }
}

// 유저 아이디 변경
export const updateUserNicknameApi = async (
  accessToken: string,
  memberId: number,
  nickname: string,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/member/nickname/${memberId}`
    return flipitAxios.patch(
      API,
      {
        nickname: nickname,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
  }
  try {
    return await makeRequest(accessToken)
  } catch (error: any) {
    console.error(error)
    if (error.response.data.errorCode === 'T-001') {
      const newAccessToken = await postRefreshToken(refreshToken, setUserInfo)
      return await makeRequest(newAccessToken)
    }
  }
}

// 로그아웃
export const logoutApi = async (fcmToken: string, accessToken: string, refreshToken: string, setUserInfo: any) => {
  const makeRequest = async (token: string) => {
    let API = `/api/auth/logout?${fcmToken}`
    return flipitAxios.post(API, '', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }
  try {
    return await makeRequest(accessToken)
  } catch (error: any) {
    console.error(error)
    if (error.response.data.errorCode === 'T-001') {
      const newAccessToken = await postRefreshToken(refreshToken, setUserInfo)
      return await makeRequest(newAccessToken)
    }
  }
}

// 회원탈퇴
export const signOutApi = async (accessToken: string, memberId: number, refreshToken: string, setUserInfo: any) => {
  const makeRequest = async (token: string) => {
    let API = `/api/member/${memberId}`
    return flipitAxios.delete(API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }
  try {
    return await makeRequest(accessToken)
  } catch (error: any) {
    console.error(error)
    if (error.response.data.errorCode === 'T-001') {
      const newAccessToken = await postRefreshToken(refreshToken, setUserInfo)
      return await makeRequest(newAccessToken)
    }
  }
}
