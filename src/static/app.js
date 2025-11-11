document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Utility to escape text inserted into HTML
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and reset select options to avoid duplicates on re-fetch
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHtml = `
          <div class="participants">
            <div class="participants-header">
              <strong>Participants</strong>
              <span class="participant-count">${details.participants.length} signed up</span>
            </div>
        `;

        if (details.participants && details.participants.length > 0) {
          participantsHtml += '<ul class="participants-list" style="list-style: none; padding-left: 0;">';
          details.participants.forEach((p) => {
            participantsHtml += `<li style="display: flex; align-items: center; gap: 0.5em;">
              <span>${escapeHtml(p)}</span>
              <button class="delete-participant" title="Remove participant" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" style="background: none; border: none; color: #c00; cursor: pointer; font-size: 1.1em;">&#128465;</button>
            </li>`;
          });
          participantsHtml += '</ul>';
        } else {
          participantsHtml += `<p class="no-participants">No participants yet</p>`;
        }

        participantsHtml += `</div>`; // close .participants

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-participant').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const activity = btn.getAttribute('data-activity');
            const email = btn.getAttribute('data-email');
            if (!activity || !email) return;
            if (!confirm(`Remove ${email} from ${activity}?`)) return;
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "Failed to remove participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (error) {
              messageDiv.textContent = "Failed to remove participant.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            }
          });
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list after signup
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
