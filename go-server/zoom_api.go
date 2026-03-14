package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func getToken(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")

	if code == "" {
		http.Redirect(w, r,
			"https://zoom.us/oauth/authorize?response_type=code&client_id="+os.Getenv("clientID")+"&redirect_uri="+redirectURL,
			http.StatusFound)
		return
	}

	url := "https://zoom.us/oauth/token?grant_type=authorization_code&code=" + code + "&redirect_uri=" + redirectURL

	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}
	req.SetBasicAuth(os.Getenv("clientID"), os.Getenv("clientSecret"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to get token", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		http.Error(w, "Failed to parse token response", http.StatusInternalServerError)
		return
	}

	accessToken := tokenResp.AccessToken

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, `<label for="accounts">Choose an account:</label>
    <select id="accounts" form="form">
      <option value="sanjeev@dreamsoft4u.com">sanjeev@dreamsoft4u.com</option>
      <option value="careers@dreamsoft4u.com">careers@dreamsoft4u.com</option>
      <option value="gaurav.s@dreamsoft4u.com">gaurav.s@dreamsoft4u.com</option>
    </select>
    <form id="form">
         <button type="submit">Submit</button>
    </form>
    <script>
      const form = document.getElementById("form");

    form.addEventListener("submit", formSubmit);

    function formSubmit(e) {
      e.preventDefault()
      const select = document.getElementById("accounts")
      const account = select.value
      console.log(account)
      console.log("%s")

      fetch("/download",{
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            account,
            access_token:"%s"
        }),
      })
      .then(response => response.json()).then(transactionId => {
        window.location.href= ("https://zoom.kshitizagrawal.in/status/" + transactionId)}
        )
      .catch(error => console.error(error))
    }
    </script>
    <footer style="position:absolute; bottom:0;">
    <a href="https://github.com/Kshitiz1403"> Kshitiz Agrawal</a>
    </footer>`, accessToken, accessToken)
}
