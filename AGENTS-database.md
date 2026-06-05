# StudyHub — Data Models

## Subject
{ id:string, name:string, icon:string, description:string, color:string, classroom:string, quizzes:Quiz[], links:Link[] }

## Quiz
{ id:string, title:string, questions:Question[] }

## Question  
{ question:string, options:string[4], answer:string }

## Link
{ title:string, url:string, description:string }

## InfoSection
{ title:string(HTML), content:string(HTML) }

## ChatRoom
{ name:string, description:string, topic:string, type:"public"|"private", password?:string, createdBy:string(uid), createdByName:string, blocked?:string[](emails) }

## ChatMessage
{ userId:string(uid), userName:string, userEmail?:string, text:string, timestamp:Timestamp }

## User
{ uid:string, email:string, createdAt:string(ISO), lastSeen:string(ISO) }

## Request
{ name:string, subjectId:string, subjectName:string, actionType:"add"|"edit"|"remove", targetType:"quiz"|"link"|"subject", message:string, timestamp:string(ISO), status:"open"|"resolved" }

## Feedback
{ name:string, message:string, timestamp:string(ISO) }

## Firebase Rules Needed
- All reads: require auth
- Chat messages: user can only create own messages
- Chat rooms: only creator can delete
- Users: user can only write own doc
