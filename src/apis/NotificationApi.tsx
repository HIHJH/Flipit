import { flipitAxios, postRefreshToken } from './apis'

export const getNotificationList = async (
  memberId: number,
  accessToken: string,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/notifications/member/${memberId}`
    const response = await flipitAxios.get(API, {
      params: memberId,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data.notificationList
  }
  try {
    return await makeRequest(accessToken)
  } catch (error: any) {
    console.error(error)
    if (error.response.data.errorCode === 'T-001') {
      const newAccessToken = await postRefreshToken(refreshToken, setUserInfo)
      console.log('new' + newAccessToken)
      return await makeRequest(newAccessToken)
    }
  }
}

export const postFCM = async (
  memberId: number,
  accessToken: string,
  fcmToken: string,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/fcm/${memberId}`
    const response = await flipitAxios.post(
      API,
      {
        fcmToken,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )
    console.log(response)
  }
  try {
    return await makeRequest(accessToken)
  } catch (error: any) {
    console.error(error)
    if (error.response.data.errorCode === 'T-001') {
      const newAccessToken = await postRefreshToken(refreshToken, setUserInfo)
      console.log('new' + newAccessToken)
      return await makeRequest(newAccessToken)
    }
  }
}
