Sri Lanka Flood Relief - Public Data API
Export
v1.0
Implicit OAuth Flow

Authorize URL: https:///authorize

REST API providing real-time access to help requests and volunteer contributions. Authentication is required via API Key.

Fetch public flood-relief data (requests + contributions)
get
https://api.floodsupport.org/default/sri-lanka-flood-relief-jm/v1.0/public-data-api
Returns filtered help requests and/or contributions.

Request
Query Parameters
assistance_type
string
Assistance type filter (Food, Medicine, Clothing, etc.)

contribution_type
string
Contribution type filter.

establishment
string
Relief camp establishment type.

Allowed values:
all
School
Temple
Kitchen
Dispensary
Tent
Private Land
Other
Default:
all
lat
number<float>
Latitude for location-based filtering.

limit
integer
Max results per request.

<= 500
Default:
100
lng
number<float>
Longitude for location-based filtering.

offset
integer
Pagination offset.

Default:
0
pickup_required
string
Filter contributions requiring pickup.

Allowed values:
all
true
false
Default:
all
radius_km
number<float>
Radius in kilometers for distance filtering.

search
string
Text search across names, addresses, notes, and item types.

sort
string
Sort method.

Allowed values:
newest
oldest
urgency
distance
Default:
newest
status
string
Status filter.

Allowed values:
all
pending
resolved
available
Default:
all
type
string
Filter by data type.

Allowed values:
all
requests
contributions
Default:
all
urgency
string
Urgency filter (requests only).

Allowed values:
all
emergency
high
medium
low
Default:
all
verified
string
Filter by contribution verification status.

Allowed values:
all
true
false
Default:
all
Responses
200
401
Successful data response

Body

application/json

application/json
responses
/
200
requests
array[object]
id
string<uuid>
full_name
string
mobile_number
string
mobile_number_2
string
email
string
address
string
latitude
number
longitude
number
establishment_type
string
num_men
integer
num_women
integer
num_children
integer
urgency
string
Allowed values:
emergency
high
medium
low
status
string
Allowed values:
pending
resolved
assistance_types
array[string]
additional_notes
string
image_urls
array[string]
created_at
string<date-time>
updated_at
string<date-time>
resolved_at
string<date-time>
resolved_by_name
string
resolved_by_user_id
string
distance_km
number
contributions
array[object]
id
string<uuid>
full_name
string
mobile_number
string
mobile_number_2
string
email
string
address
string
latitude
number
longitude
number
contribution_types
array[string]
goods_types
array[string]
services_types
array[string]
labor_types
array[string]
coverage_radius_km
number
status
string
Allowed values:
available
engaged
unavailable
verified
boolean
verified_by_name
string
verified_by_user_id
string
verified_at
string<date-time>
pickup_required
boolean
availability_notes
string
additional_notes
string
created_at
string<date-time>
updated_at
string<date-time>
distance_km
number
meta
object
total_requests
integer
total_contributions
integer
filters_applied
object
pagination
object
api-key
:
123
assistance_type
:
string
contribution_type
:
string
establishment
:
Not SetallSchoolTempleKitchenDispensaryTentPrivate LandOther

select an option (defaults to: all)
lat
:
number
limit
:
defaults to: 100
lng
:
number
offset
:
defaults to: 0
pickup_required
:
Not Setalltruefalse

select an option (defaults to: all)
radius_km
:
number
search
:
string
sort
:
Not Setnewestoldesturgencydistance

select an option (defaults to: newest)
status
:
Not Setallpendingresolvedavailable

select an option (defaults to: all)
type
:
Not Setallrequestscontributions

select an option (defaults to: all)
urgency
:
Not Setallemergencyhighmediumlow

select an option (defaults to: all)
verified
:
Not Setalltruefalse

select an option (defaults to: all)
Send API Request
curl --request GET \
  --url https://api.floodsupport.org/default/sri-lanka-flood-relief-jm/v1.0/public-data-api \
  --header 'Accept: application/json' \
  --header 'api-key: 123'
{
  "requests": [
    {
      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
      "full_name": "string",
      "mobile_number": "string",
      "mobile_number_2": "string",
      "email": "string",
      "address": "string",
      "latitude": 0,
      "longitude": 0,
      "establishment_type": "string",
      "num_men": 0,
      "num_women": 0,
      "num_children": 0,
      "urgency": "emergency",
      "status": "pending",
      "assistance_types": [
        "string"
      ],
      "additional_notes": "string",
      "image_urls": [
        "string"
      ],
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z",
      "resolved_at": "2019-08-24T14:15:22Z",
      "resolved_by_name": "string",
      "resolved_by_user_id": "string",
      "distance_km": 0
    }
  ],
  "contributions": [
    {
      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
      "full_name": "string",
      "mobile_number": "string",
      "mobile_number_2": "string",
      "email": "string",
      "address": "string",
      "latitude": 0,
      "longitude": 0,
      "contribution_types": [
        "string"
      ],
      "goods_types": [
        "string"
      ],
      "services_types": [
        "string"
      ],
      "labor_types": [
        "string"
      ],
      "coverage_radius_km": 0,
      "status": "available",
      "verified": true,
      "verified_by_name": "string",
      "verified_by_user_id": "string",
      "verified_at": "2019-08-24T14:15:22Z",
      "pickup_required": true,
      "availability_notes": "string",
      "additional_notes": "string",
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z",
      "distance_km": 0
    }
  ],
  "meta": {
    "total_requests": 0,
    "total_contributions": 0,
    "filters_applied": {},
    "pagination": {
      "limit": 0,
      "offset": 0,
      "returned_requests": 0,
      "returned_contributions": 0
    }
  }

PublicApiResponse
requests
array[object]
id
string<uuid>
full_name
string
mobile_number
string
mobile_number_2
string
email
string
address
string
latitude
number
longitude
number
establishment_type
string
num_men
integer
num_women
integer
num_children
integer
urgency
string
Allowed values:
emergency
high
medium
low
status
string
Allowed values:
pending
resolved
assistance_types
array[string]
additional_notes
string
image_urls
array[string]
created_at
string<date-time>
updated_at
string<date-time>
resolved_at
string<date-time>
resolved_by_name
string
resolved_by_user_id
string
distance_km
number
contributions
array[object]
id
string<uuid>
full_name
string
mobile_number
string
mobile_number_2
string
email
string
address
string
latitude
number
longitude
number
contribution_types
array[string]
goods_types
array[string]
services_types
array[string]
labor_types
array[string]
coverage_radius_km
number
status
string
Allowed values:
available
engaged
unavailable
verified
boolean
verified_by_name
string
verified_by_user_id
string
verified_at
string<date-time>
pickup_required
boolean
availability_notes
string
additional_notes
string
created_at
string<date-time>
updated_at
string<date-time>
distance_km
number
meta
object
total_requests
integer
total_contributions
integer
filters_applied
object
pagination
object
{
  "requests": [
    {
      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
      "full_name": "string",
      "mobile_number": "string",
      "mobile_number_2": "string",
      "email": "string",
      "address": "string",
      "latitude": 0,
      "longitude": 0,
      "establishment_type": "string",
      "num_men": 0,
      "num_women": 0,
      "num_children": 0,
      "urgency": "emergency",
      "status": "pending",
      "assistance_types": [
        null
      ],
      "additional_notes": "string",
      "image_urls": [
        null
      ],
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z",
      "resolved_at": "2019-08-24T14:15:22Z",
      "resolved_by_name": "string",
      "resolved_by_user_id": "string",
      "distance_km": 0
    }
  ],
  "contributions": [
    {
      "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
      "full_name": "string",
      "mobile_number": "string",
      "mobile_number_2": "string",
      "email": "string",
      "address": "string",
      "latitude": 0,
      "longitude": 0,
      "contribution_types": [
        null
      ],
      "goods_types": [
        null
      ],
      "services_types": [
        null
      ],
      "labor_types": [
        null
      ],
      "coverage_radius_km": 0,
      "status": "available",
      "verified": true,
      "verified_by_name": "string",
      "verified_by_user_id": "string",
      "verified_at": "2019-08-24T14:15:22Z",
      "pickup_required": true,
      "availability_notes": "string",
      "additional_notes": "string",
      "created_at": "2019-08-24T14:15:22Z",
      "updated_at": "2019-08-24T14:15:22Z",
      "distance_km": 0
    }
  ],
  "meta": {
    "total_requests": 0,
    "total_contributions": 0,
    "filters_applied": {},
    "pagination": {
      "limit": 0,
      "offset": 0,
      "returned_requests": 0,
      "returned_contributions": 0
    }
  }

Request
id
string<uuid>
full_name
string
mobile_number
string
mobile_number_2
string
email
string
address
string
latitude
number
longitude
number
establishment_type
string
num_men
integer
num_women
integer
num_children
integer
urgency
string
Allowed values:
emergency
high
medium
low
status
string
Allowed values:
pending
resolved
assistance_types
array[string]
additional_notes
string
image_urls
array[string]
created_at
string<date-time>
updated_at
string<date-time>
resolved_at
string<date-time>
resolved_by_name
string
resolved_by_user_id
string
distance_km
number
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "full_name": "string",
  "mobile_number": "string",
  "mobile_number_2": "string",
  "email": "string",
  "address": "string",
  "latitude": 0,
  "longitude": 0,
  "establishment_type": "string",
  "num_men": 0,
  "num_women": 0,
  "num_children": 0,
  "urgency": "emergency",
  "status": "pending",
  "assistance_types": [
    "string"
  ],
  "additional_notes": "string",
  "image_urls": [
    "string"
  ],
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z",
  "resolved_at": "2019-08-24T14:15:22Z",
  "resolved_by_name": "string",
  "resolved_by_user_id": "string",
  "distance_km": 0

Contribution
id
string<uuid>
full_name
string
mobile_number
string
mobile_number_2
string
email
string
address
string
latitude
number
longitude
number
contribution_types
array[string]
goods_types
array[string]
services_types
array[string]
labor_types
array[string]
coverage_radius_km
number
status
string
Allowed values:
available
engaged
unavailable
verified
boolean
verified_by_name
string
verified_by_user_id
string
verified_at
string<date-time>
pickup_required
boolean
availability_notes
string
additional_notes
string
created_at
string<date-time>
updated_at
string<date-time>
distance_km
number
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "full_name": "string",
  "mobile_number": "string",
  "mobile_number_2": "string",
  "email": "string",
  "address": "string",
  "latitude": 0,
  "longitude": 0,
  "contribution_types": [
    "string"
  ],
  "goods_types": [
    "string"
  ],
  "services_types": [
    "string"
  ],
  "labor_types": [
    "string"
  ],
  "coverage_radius_km": 0,
  "status": "available",
  "verified": true,
  "verified_by_name": "string",
  "verified_by_user_id": "string",
  "verified_at": "2019-08-24T14:15:22Z",
  "pickup_required": true,
  "availability_notes": "string",
  "additional_notes": "string",
  "created_at": "2019-08-24T14:15:22Z",
  "updated_at": "2019-08-24T14:15:22Z",
  "distance_km": 0
}

Meta
total_requests
integer
total_contributions
integer
filters_applied
object
pagination
object
limit
integer
offset
integer
returned_requests
integer
returned_contributions
integer
{
  "total_requests": 0,
  "total_contributions": 0,
  "filters_applied": {},
  "pagination": {
    "limit": 0,
    "offset": 0,
    "returned_requests": 0,
    "returned_contributions": 0
  }
