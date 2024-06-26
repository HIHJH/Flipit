import { flipitAxios, postRefreshToken } from './apis'

export const answerApi = async (
  accessToken: string,
  memberId: number,
  imageFile: File | undefined,
  request: any,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/answers/${memberId}`
    // FormData 객체 생성
    const formData = new FormData()
    // categoryImage가 undefined가 아니면 FormData에 추가
    if (imageFile) {
      formData.append('imageFile', imageFile)
    }
    formData.append('request', JSON.stringify(request))
    return flipitAxios.post(API, formData, {
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

export const getFeedsApi = (memberId: number, selectedDirectoryId: number, page: number) => {
  const categoryRecent = ['answer.createdDate,desc']

  let API = `/api/answers/member/${memberId}?categoryId=${selectedDirectoryId}&page=${page}&size=6&sort=${categoryRecent}`
  return flipitAxios.get(API)
}

export const getTotalFeedsApi = (memberId: number) => {
  const recent = ['createdDate,desc']
  let API = `/api/answers/member/${memberId}?sort=${recent}`
  return flipitAxios.get(API)
}

export const connectGroupApi = async (
  accessToken: string,
  categoryId: number,
  answerId: number,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/category/${categoryId}/answers/${answerId}`
    return flipitAxios.post(
      API,
      {},
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

export const deleteFeedApi = async (accessToken: string, answerId: number, refreshToken: string, setUserInfo: any) => {
  const makeRequest = async (token: string) => {
    let API = `/api/answers/${answerId}`
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

export const modifyFeedApi = async (
  accessToken: string,
  answerId: number,
  imageFile: File | undefined,
  request: any,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/answers/${answerId}`
    // FormData 객체 생성
    const formData = new FormData()
    // categoryImage가 undefined가 아니면 FormData에 추가
    if (imageFile && imageFile !== undefined) {
      formData.append('imageFile', imageFile)
    }
    formData.append(
      'request',
      JSON.stringify({
        ...request,
        updateImage: imageFile === undefined ? false : true,
      }),
    )
    return flipitAxios.put(API, formData, {
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

export const getReactCountApi = (answerId: number) => {
  let API = `/api/reactionsCount/${answerId}/reactionsCount`
  return flipitAxios.get(API)
}

export const getIsReactedApi = async (
  accessToken: string,
  answerId: number,
  memberId: number,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/answers/${answerId}/reacted?memberId=${memberId}`
    return flipitAxios.get(API, {
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

export const postReactApi = async (
  accessToken: string,
  answerId: number,
  memberId: number,
  reaction: string,
  refreshToken: string,
  setUserInfo: any,
) => {
  const makeRequest = async (token: string) => {
    let API = `/api/reactions/${memberId}/${answerId}`
    return flipitAxios.post(
      API,
      {
        reaction: reaction,
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

export const extractImageApi = (url: string) => {
  let API = `/api/image?url=${url}`
  return flipitAxios.get(API)
}
