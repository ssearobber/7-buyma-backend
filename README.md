# buyma backend

## [notion link](https://www.notion.so/buyma-f3a57a4c07e048989d1859560418db0f)


2021/05/12  
product리스트 추출부분  
- router.get("/products" .... 부분
- productId 중복 제거를 백엔드에서 함 ⇨ sql로 바꿈
- 1.distinct로 중복제거 productId 취득 2. 배열 productId 취득, 날짜 max만 취득, sort access 오름차순
- 어제 데이터로 product목록을 최신화 (어제날짜 > db의today)
[raw sql 참고](https://sequelize.org/master/manual/raw-queries.html)

2021/05/16
댓글 테이블 추가
- api추가