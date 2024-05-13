import { flipitAxios } from './apis'

export const answerApi = (accessToken: string, memberId: number, imageFile: File | undefined, request: any) => {
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
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const getFeedsApi = (accessToken: string, memberId: number) => {
  const sort = ['createdDate,desc']
  let API = `/api/answers?memberId=${memberId}&page=0&size=10&sort=${sort}`
  return flipitAxios.get(API, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export const connectGroupApi = (accessToken: string, categoryId: number, answerId: number) => {
  let API = `/api/category/${categoryId}/answers/${answerId}`
  return flipitAxios.post(
    API,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
}
