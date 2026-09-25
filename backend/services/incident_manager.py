import requests


class IncidentManager:

    def __init__(
        self,
        api_url="http://127.0.0.1:8000/api/events",
        bus_id="BUS-001"
    ):

        self.api_url = api_url
        self.bus_id = bus_id


    # ==========================================
    # SEND CONFIRMED INCIDENT TO BACKEND
    # ==========================================

    def send_incident(
        self,
        incident,
        latitude,
        longitude,
        evidence_url=None
    ):

        payload = {

            "event_id":
                incident["incident_id"],

            "bus_id":
                self.bus_id,

            "event_type":
                incident["incident_type"],

            "latitude":
                latitude,

            "longitude":
                longitude,

            "confidence":
                incident["confidence"],

            "evidence_url":
                evidence_url
        }


        try:

            response = requests.post(

                self.api_url,

                json=payload,

                timeout=10
            )


            response.raise_for_status()


            print(
                "\nEVENT SENT TO BACKEND SUCCESSFULLY"
            )

            print(
                response.json()
            )


            return response.json()


        except requests.exceptions.RequestException as error:

            print(
                "\nERROR SENDING INCIDENT TO BACKEND:"
            )

            print(error)


            return None