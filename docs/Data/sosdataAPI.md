SOS Emergency API
Export
v1.0
Implicit OAuth Flow

Authorize URL: https:///authorize

API for submitting and managing emergency requests during flood situations

Submit Emergency Request
post
https://api.floodsupport.org/default/sos-emergency-api/v1.0/sos/public
Submit a new emergency request without authentication

Request
Body

application/json

application/json
fullName
string
required
Full name of the person in emergency

Example:
John Doe
phoneNumber
string
required
Primary contact phone number

Example:
+94771234567
alternatePhone
string
Alternative contact phone number

Example:
+94712345678
latitude
number<double>
GPS latitude coordinate

Example:
6.9271
longitude
number<double>
GPS longitude coordinate

Example:
79.8612
address
string
Full address of the emergency location

Example:
123 Main Street, Colombo
landmark
string
Nearby landmark for easier location

Example:
Near City Hospital
district
string
District name

Example:
Colombo
emergencyType
string
Allowed values:
TRAPPED
MEDICAL
FOOD_WATER
RESCUE_NEEDED
SHELTER_NEEDED
MISSING_PERSON
RESCUE_ASSISTANCE_H
MEDICAL_ASSISTANCE_H
COOKED_FOOD_H
DRINKING_WATER_H
DRY_FOOD_H
SHELTER_H
CLOTHING_H
SANITARY_MATERIALS_H
OTHER
Example:
TRAPPED
numberOfPeople
integer
Number of people affected

>= 1
Example:
4
hasChildren
boolean
Whether children are present

Default:
false
hasElderly
boolean
Whether elderly people are present

Default:
false
hasDisabled
boolean
Whether disabled people are present

Default:
false
hasMedicalEmergency
boolean
Whether there is a medical emergency

Default:
false
medicalDetails
string
Details about medical emergency

Example:
Diabetic patient, insulin needed
waterLevel
string
Allowed values:
ANKLE
KNEE
WAIST
CHEST
NECK
ROOF
Example:
WAIST
buildingType
string
Type of building

Example:
Residential house
floorLevel
integer
Floor level of trapped location

Example:
2
safeForHours
number
Estimated hours safe in current location

Example:
6
description
string
Additional description of the situation

Example:
Water rising rapidly, need immediate rescue
hasFood
boolean
Whether food is available

Default:
false
hasWater
boolean
Whether drinking water is available

Default:
false
hasPowerBank
boolean
Whether power bank is available

Default:
false
batteryPercentage
integer
Current battery percentage

>= 0
<= 100
Example:
45
photoUrl
string<uri>
URL of uploaded photo

photoPublicId
string
Public ID of photo in cloud storage

source
string
Source of the request

Example:
PUBLIC
title
string
Title or summary of the emergency

Example:
Family trapped on roof
priority
string
Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:
HIGH
Responses
200
400
500
Emergency request submitted successfully

Body

application/json

application/json
responses
/
200
success
boolean
Example:
true
message
string
Example:
Emergency request submitted successfully
data
object
id
integer
Example:
12345
referenceNumber
string
Example:
SOS-2024-12345
status
string
Allowed values:
PENDING
ACKNOWLEDGED
IN_PROGRESS
RESCUED
VERIFIED
SECOND_VERIFICATION
CANNOT_CONTACT
COMPLETED
CANCELLED
Example:
PENDING
priority
string
Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:
HIGH
createdAt
string<date-time>
Example:
2024-12-01T10:30:00Z
Token
:
Bearer 123
{
  "fullName": "John Doe",
  "phoneNumber": "+94771234567",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "emergencyType": "TRAPPED"
}
{
  "fullName": "John Doe",
  "phoneNumber": "+94771234567",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "emergencyType": "TRAPPED"
}
Send API Request
curl --request POST \
  --url https://api.floodsupport.org/default/sos-emergency-api/v1.0/sos/public \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer 123' \
  --header 'Content-Type: application/json' \
  --data '{
  "fullName": "John Doe",
  "phoneNumber": "+94771234567",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "emergencyType": "TRAPPED"
}'
{
  "success": true,
  "message": "Emergency request submitted successfully",
  "data": {
    "id": 12345,
    "referenceNumber": "SOS-2024-12345",
    "status": "PENDING",
    "priority": "HIGH",
    "createdAt": "2024-12-01T10:30:00Z"
  }

Get Filtered Emergency Requests
get
https://api.floodsupport.org/default/sos-emergency-api/v1.0/sos
Retrieve emergency requests with filtering, pagination, and statistics.

Request
Query Parameters
assignedTo
integer
Filter by assigned user ID (verifier or coordinator)

district
string
Filter by district name

Examples:
Colombo
emergencyType
string
Filter by emergency type

Allowed values:
TRAPPED
MEDICAL
FOOD_WATER
RESCUE_NEEDED
SHELTER_NEEDED
MISSING_PERSON
RESCUE_ASSISTANCE_H
MEDICAL_ASSISTANCE_H
COOKED_FOOD_H
DRINKING_WATER_H
DRY_FOOD_H
SHELTER_H
CLOTHING_H
SANITARY_MATERIALS_H
OTHER
Example:
TRAPPED
hasActionTaken
boolean
Filter by whether action has been taken

limit
integer
Number of results per page

>= 1
<= 100
Default:
50
notVerified
boolean
Filter for unverified requests

page
integer
Page number for pagination

>= 1
Default:
1
priority
string
Filter by priority level

Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:
HIGH
search
string
Search in fullName and phoneNumber fields (partial match)

Examples:
John
source
string
Filter by data source

Allowed values:
WEB
PUBLIC
Example:
PUBLIC
status
string
Filter by request status

Allowed values:
PENDING
ACKNOWLEDGED
IN_PROGRESS
RESCUED
VERIFIED
SECOND_VERIFICATION
CANNOT_CONTACT
COMPLETED
CANCELLED
Example:
PENDING
Responses
200
401
500
Successfully retrieved filtered requests

Body

application/json

application/json
responses
/
200
success
boolean
Example:
true
data
array[object]
id
integer
Example:
12345
referenceNumber
string
Example:
SOS-2024-12345
fullName
string
Example:
John Doe
phoneNumber
string
Example:
+94771234567
status
string
Allowed values:
PENDING
ACKNOWLEDGED
IN_PROGRESS
RESCUED
VERIFIED
SECOND_VERIFICATION
CANNOT_CONTACT
COMPLETED
CANCELLED
Example:
PENDING
priority
string
Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:
HIGH
emergencyType
string
Allowed values:
TRAPPED
MEDICAL
FOOD_WATER
RESCUE_NEEDED
SHELTER_NEEDED
MISSING_PERSON
RESCUE_ASSISTANCE_H
MEDICAL_ASSISTANCE_H
COOKED_FOOD_H
DRINKING_WATER_H
DRY_FOOD_H
SHELTER_H
CLOTHING_H
SANITARY_MATERIALS_H
OTHER
Example:
TRAPPED
district
string
Example:
Colombo
createdAt
string<date-time>
Example:
2024-12-01T10:30:00Z
notesCount
integer
Example:
3
verifier
object
coordinator
object
pagination
object
currentPage
integer
Example:
1
totalPages
integer
Example:
10
totalCount
integer
Example:
487
limit
integer
Example:
50
hasNextPage
boolean
Example:
true
hasPrevPage
boolean
Example:
false
stats
object
total
integer
Total number of requests

Example:
487
totalPeople
integer
Total number of people affected

Example:
1834
missingPeopleCount
integer
Number of missing people

Example:
23
byStatus
dictionary[string, integer]
Example:
{"PENDING":120,"IN_PROGRESS":45,"RESCUED":200}
byPriority
dictionary[string, integer]
Example:
{"CRITICAL":30,"HIGH":80,"MEDIUM":250}
Token
:
Bearer 123
assignedTo
:
integer
district
:
example: Colombo
emergencyType
:
Not SetTRAPPEDMEDICALFOOD_WATERRESCUE_NEEDEDSHELTER_NEEDEDMISSING_PERSONRESCUE_ASSISTANCE_HMEDICAL_ASSISTANCE_HCOOKED_FOOD_HDRINKING_WATER_HDRY_FOOD_HSHELTER_HCLOTHING_HSANITARY_MATERIALS_HOTHER

select an option
hasActionTaken
:
Not SetFalseTrue

select an option
limit
:
defaults to: 50
notVerified
:
Not SetFalseTrue

select an option
page
:
defaults to: 1
priority
:
Not SetHIGHLY_CRITICALCRITICALHIGHMEDIUMLOW

select an option
search
:
example: John
source
:
Not SetWEBPUBLIC

select an option
status
:
Not SetPENDINGACKNOWLEDGEDIN_PROGRESSRESCUEDVERIFIEDSECOND_VERIFICATIONCANNOT_CONTACTCOMPLETEDCANCELLED

select an option
Send API Request
curl --request GET \
  --url https://api.floodsupport.org/default/sos-emergency-api/v1.0/sos \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer 123'
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "referenceNumber": "SOS-2024-12345",
      "fullName": "John Doe",
      "phoneNumber": "+94771234567",
      "status": "PENDING",
      "priority": "HIGH",
      "emergencyType": "TRAPPED",
      "district": "Colombo",
      "createdAt": "2024-12-01T10:30:00Z",
      "notesCount": 3,
      "verifier": {
        "id": 789,
        "name": "Jane Smith",
        "phoneNumber": "+94777654321"
      },
      "coordinator": {
        "id": 789,
        "name": "Jane Smith",
        "phoneNumber": "+94777654321"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalCount": 487,
    "limit": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "stats": {
    "total": 487,
    "totalPeople": 1834,
    "missingPeopleCount": 23,
    "byStatus": {
      "PENDING": 120,
      "IN_PROGRESS": 45,
      "RESCUED": 200
    },
    "byPriority": {
      "CRITICAL": 30,
      "HIGH": 80,
      "MEDIUM": 250
    }
  }
}

EmergencyRequest
fullName
string
required
Full name of the person in emergency

Example:
John Doe
phoneNumber
string
required
Primary contact phone number

Example:
+94771234567
alternatePhone
string
Alternative contact phone number

Example:
+94712345678
latitude
number<double>
GPS latitude coordinate

Example:
6.9271
longitude
number<double>
GPS longitude coordinate

Example:
79.8612
address
string
Full address of the emergency location

Example:
123 Main Street, Colombo
landmark
string
Nearby landmark for easier location

Example:
Near City Hospital
district
string
District name

Example:
Colombo
emergencyType
string
Allowed values:
TRAPPED
MEDICAL
FOOD_WATER
RESCUE_NEEDED
SHELTER_NEEDED
MISSING_PERSON
RESCUE_ASSISTANCE_H
MEDICAL_ASSISTANCE_H
COOKED_FOOD_H
DRINKING_WATER_H
DRY_FOOD_H
SHELTER_H
CLOTHING_H
SANITARY_MATERIALS_H
OTHER
Example:
TRAPPED
numberOfPeople
integer
Number of people affected

>= 1
Example:
4
hasChildren
boolean
Whether children are present

Default:
false
hasElderly
boolean
Whether elderly people are present

Default:
false
hasDisabled
boolean
Whether disabled people are present

Default:
false
hasMedicalEmergency
boolean
Whether there is a medical emergency

Default:
false
medicalDetails
string
Details about medical emergency

Example:
Diabetic patient, insulin needed
waterLevel
string
Allowed values:
ANKLE
KNEE
WAIST
CHEST
NECK
ROOF
Example:
WAIST
buildingType
string
Type of building

Example:
Residential house
floorLevel
integer
Floor level of trapped location

Example:
2
safeForHours
number
Estimated hours safe in current location

Example:
6
description
string
Additional description of the situation

Example:
Water rising rapidly, need immediate rescue
hasFood
boolean
Whether food is available

Default:
false
hasWater
boolean
Whether drinking water is available

Default:
false
hasPowerBank
boolean
Whether power bank is available

Default:
false
batteryPercentage
integer
Current battery percentage

>= 0
<= 100
Example:
45
photoUrl
string<uri>
URL of uploaded photo

photoPublicId
string
Public ID of photo in cloud storage

source
string
Source of the request

Example:
PUBLIC
title
string
Title or summary of the emergency

Example:
Family trapped on roof
priority
string
Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:


EmergencyResponse
success
boolean
Example:
true
message
string
Example:
Emergency request submitted successfully
data
object
id
integer
Example:
12345
referenceNumber
string
Example:
SOS-2024-12345
status
string
Allowed values:
PENDING
ACKNOWLEDGED
IN_PROGRESS
RESCUED
VERIFIED
SECOND_VERIFICATION
CANNOT_CONTACT
COMPLETED
CANCELLED
Example:
PENDING
priority
string
Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:
HIGH
createdAt
string<date-time>
Example:
2024-12-01T10:30:00Z

EmergencyTypeEnum
string
Allowed values:
TRAPPED
MEDICAL
FOOD_WATER
RESCUE_NEEDED
SHELTER_NEEDED
MISSING_PERSON
RESCUE_ASSISTANCE_H
MEDICAL_ASSISTANCE_H
COOKED_FOOD_H
DRINKING_WATER_H
DRY_FOOD_H
SHELTER_H
CLOTHING_H
SANITARY_MATERIALS_H
OTHER
Example:
TRAPPED
TRAPPED

WaterLevelEnum
string
Allowed values:
ANKLE
KNEE
WAIST
CHEST
NECK
ROOF
Example:
WAIST
WAIST

StatusEnum
string
Allowed values:
PENDING
ACKNOWLEDGED
IN_PROGRESS
RESCUED
VERIFIED
SECOND_VERIFICATION
CANNOT_CONTACT
COMPLETED
CANCELLED
Example:
PENDING
PENDING

PriorityEnum
string
Allowed values:
HIGHLY_CRITICAL
CRITICAL
HIGH
MEDIUM
LOW
Example:
HIGH
HIGH

SourceEnum
string
Allowed values:
WEB
PUBLIC
Example:
PUBLIC
PUBLIC

Error
success
boolean
Example:
false
message
string
Example:
An error occurred
error
string
Example:
Invalid request parameters
{
  "success": false,
  "message": "An error occurred",
  "error": "Invalid request parameters"
}