import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore, collectionGroup, collection, updateDoc, deleteDoc, doc, addDoc, getDocs, getDoc, Timestamp, setDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2ACxlgsaO0_E2zA1zsPEntCXOIHaG21I",
    authDomain: "bonbon-8a34a.firebaseapp.com",
    projectId: "bonbon-8a34a",
    storageBucket: "bonbon-8a34a.firebasestorage.app",
    messagingSenderId: "276254510771",
    appId: "1:276254510771:web:b936bce5f45ed255b56ac6",
    measurementId: "G-85BQTNL30R"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function showModal(message, isSuccess) {
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    const modalMessage = document.getElementById('modalMessage');
  
    modalMessage.textContent = message;
  
    // Change color based on success or error
    if (isSuccess) {
        document.querySelector('#loadingModal .modal-content').style.backgroundColor = '#d4edda';
    } else {
        document.querySelector('#loadingModal .modal-content').style.backgroundColor = '#f8d7da';
    }
  
    loadingModal.show();
}
  
function hideModal() {
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.hide();
}
  
function showConfirmation(message, callback) {
    const modalElement = document.getElementById('confirmationModal');
    const modalInstance = new bootstrap.Modal(modalElement);
    const modalMessage = document.getElementById('confirmationMessage');
    const confirmButton = document.getElementById('confirmActionBtn');
  
    // Set the confirmation message
    modalMessage.textContent = message;
  
    // Remove any previous event listeners to prevent duplicate triggers
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    const newConfirmButton = document.getElementById('confirmActionBtn');
  
    // Attach the new event listener
    newConfirmButton.addEventListener("click", function () {
        callback(); // Execute the callback function
        modalInstance.hide();
    });
  
    // Show the modal
    modalInstance.show();
}

// Fetch data from Firestore and populate the table
async function fetchData() {
    const tableBody = document.querySelector("#coupons-table tbody");

    try {
        // Reference to the coupons collection
        const couponsCollection = collection(db, "coupons");

        // Get all documents in the coupons collection
        const snapshot = await getDocs(couponsCollection);

        snapshot.forEach((doc) => {
            const couponId = doc.id;
            const data = doc.data();

            console.log(`Coupon ID: ${couponId}`);
            console.log(`Coupon data: ${JSON.stringify(data)}`);

            // Convert Firestore timestamps to readable date format
            const startDate = data.coup_start ? data.coup_start.toDate().toLocaleDateString() : "N/A";
            const endDate = data.coup_end ? data.coup_end.toDate().toLocaleDateString() : "N/A";

            // Convert coup_isActive to "Active" or "Expired"
            const status = data.coup_isActive ? "Active" : "Expired";

            // Create a new table row
            const row = document.createElement("tr");
            row.setAttribute("edit-doc-old-id", couponId); // Store coupon ID in the row

            row.innerHTML = `
                <td>${couponId || "N/A"}</td>
                <td>${data.coup_amount || "N/A"}</td>
                <td>${startDate}</td>
                <td>${endDate}</td>
                <td>${data.coup_desc || "N/A"}</td>
                <td>${status}</td>
                <td >
                    <div style="display: flex !important; ">
                        <button class="action-btn edit" onclick="editCoupon(this)"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" id="delete-coupon"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);

            // Now add event listener to the delete button
              document.querySelectorAll('.delete').forEach(button => {
                button.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                  console.log("HI CONSOLE");
                  deleteCoupon(e.target);  // Pass the button as the argument
                  
                });
              });

              
            // Append a new details card
            const detailsContainer = document.createElement("div");
            detailsContainer.className = "details";
            detailsContainer.innerHTML = `
                <div class="details-card">
                    <div class="initials" style="background-color: var(--brown);">${couponId}</div>
                    <p><strong>Amount:</strong> ${data.coup_amount}</p>
                    <p><strong>Start Date:</strong> ${startDate}</p>
                    <p><strong>End Date:</strong> ${endDate}</p>
                    <p><strong>Coupon Description:</strong> ${data.coup_desc}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <div class="actions">
                        <button class="action-btn edit" onclick="editCoupon(this)"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" id="delete-coupon"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                `;
                    
                const detailsSection = document.getElementById("couponDetails-section"); // Add this ID to your parent container for details
                detailsSection.appendChild(detailsContainer);
        });

      


    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Function to add a new coupon to Firestore
async function addCoupon() {
    const couponId = document.getElementById("couponId").value.trim();
    const amountCoupon = document.getElementById("amountCoupon").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const description = document.getElementById("description").value.trim();
    const status = document.getElementById("status").value === "Active"; // Convert to boolean

    // Validate required fields
    if (!couponId || !amountCoupon || !startDate || !endDate || !description) {
        showModal("Please fill in all required fields!", false)
        return;
    }

    showConfirmation("Are you sure you want to add this coupon?", async function () {
        try {
            // Convert date input to Firestore Timestamp
            const startTimestamp = Timestamp.fromDate(new Date(startDate));
            const endTimestamp = Timestamp.fromDate(new Date(endDate));
    
            // Firestore reference to "coupons" collection
            const couponRef = doc(db, "coupons", couponId);
    
            // Add data to Firestore
            await setDoc(couponRef, {
                coup_amount: parseFloat(amountCoupon),
                coup_start: startTimestamp,
                coup_end: endTimestamp,
                coup_desc: description,
                coup_isActive: status
            });
    
            showModal("Coupon added successfully!", true);
            closeCouponModal(); // Close modal after successful save
            location.reload();
            
        } catch (error) {
            showModal("Failed to add coupon.", false);
            console.error("Error adding coupon:", error);
        }
    });
}

    // Event listener for the save button
    document.getElementById("save-coupon").addEventListener("click", addCoupon);


    document.addEventListener("DOMContentLoaded", () => {
        // Get references to the buttons
        const saveBtn = document.getElementById('save-editCoupon');
    
        // Add event listeners
        saveBtn.addEventListener('click', updateCoupon);
    });

// Update Coupon

document.getElementById("save-editCoupon").addEventListener("click", updateCoupon);

async function updateCoupon() {
    const oldCouponId = document.getElementById("edit-doc-old-id").value.trim();
    const newCouponId = document.getElementById("edit-couponId").value.trim();
    const amount = parseFloat(document.getElementById("edit-amountCoupon").value.trim()) || 0;
    const startDate = document.getElementById("edit-startDate").value.trim();
    const endDate = document.getElementById("edit-endDate").value.trim();
    const description = document.getElementById("edit-description").value.trim();
    const status = document.getElementById("edit-status").value.trim() === "Active"; // Convert to boolean

    if (!newCouponId) {
        showModal("Ooops! Coupon ID is missing. Operation failed.", false);
        return;
    }

    try {
        console.log("Fetching existing coupon data for ID:", oldCouponId);
        const existingCouponRef = doc(db, "coupons", oldCouponId);
        const existingCouponSnap = await getDoc(existingCouponRef);

        if (!existingCouponSnap.exists()) {
            showModal("Coupon does not exist.", false);
            return;
        }

        const existingCouponData = existingCouponSnap.data();

        // Convert Firestore Timestamp (MM/DD/YYYY) to `YYYY-MM-DD`
        const formatTimestampToDate = (timestamp) => {
            if (timestamp && timestamp.toDate) {
                const date = timestamp.toDate();
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
            return null;
        };

        // Normalize existing Firestore data
        const formattedExistingCouponData = {
            coup_amount: parseFloat(existingCouponData.coup_amount) || 0, // Ensure number
            coup_start: formatTimestampToDate(existingCouponData.coup_start), // Convert to YYYY-MM-DD
            coup_end: formatTimestampToDate(existingCouponData.coup_end),
            coup_desc: (existingCouponData.coup_desc || "").trim(), // Trim string
            coup_isActive: Boolean(existingCouponData.coup_isActive) // Ensure boolean
        };

        console.log("Existing Coupon Data:", formattedExistingCouponData);

        // Normalize input data
        const newCouponData = {
            coup_amount: amount,
            coup_start: startDate || null, // YYYY-MM-DD format
            coup_end: endDate || null,
            coup_desc: description, // Already trimmed
            coup_isActive: status
        };

        console.log("New Coupon Data:", newCouponData);

        // Compare changes
        const isChanged = Object.keys(newCouponData).some(
            key => newCouponData[key] !== formattedExistingCouponData[key]
        );

        console.log("Changes Detected:", isChanged);

        if (!isChanged) {
            showModal("No edits were made.", false);
            return;
        }

        // Show confirmation only if changes were detected
        showConfirmation("Are you sure you want to save your edits to this coupon?", async function () {
            try {
                const couponDataToUpdate = {
                    coup_amount: amount,
                    coup_start: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
                    coup_end: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
                    coup_desc: description,
                    coup_isActive: status
                };

                if (oldCouponId === newCouponId) {
                    await updateDoc(existingCouponRef, couponDataToUpdate);
                } else {
                    // ID changed, delete old doc and create new one
                    await deleteDoc(existingCouponRef);
                    await setDoc(doc(db, "coupons", newCouponId), couponDataToUpdate);
                }

                console.log("Coupon updated successfully!");
                showModal("Coupon updated successfully!", true);
                closeEditCouponModal();
                location.reload();

            } catch (error) {
                console.error("Error updating coupon:", error);
                showModal("Failed to update coupon.", false);
            }
        });

    } catch (error) {
        console.error("Error checking coupon changes:", error);
        showModal("An error occurred while checking changes.", false);
    }
}


async function deleteCoupon(button) {
    console.log("delete");

    let couponId, row, detailsCard, detailsContainer;

    // Check if the button is inside a table row or details card
    row = button.closest("tr");
    detailsCard = button.closest(".details-card");

    if (row) {
        // If deleting from the table
        couponId = row.cells[0].textContent;
    } else if (detailsCard) {
        // If deleting from the details card
        const initialsDiv = detailsCard.querySelector(".initials");
        couponId = initialsDiv ? initialsDiv.textContent.trim() : "";

        detailsContainer = detailsCard.closest(".details"); // Get the parent container
    } else {
        console.error("Could not find the row or details card.");
        return;
    }


    // Confirm before deleting
    showConfirmation("Are you sure you want to delete this coupon?", async function () {
    try {
        // Get reference to the employee document in Firestore
        const couponRef = doc(db, "coupons", couponId);

        // Delete the employee document from Firestore
        await deleteDoc(couponRef);

        console.log("Coupon deleted successfully!");

        // Remove the row or details card from the UI
        if (row) {
            row.remove();
        }
        if (detailsCard) {
            detailsCard.remove();
            // If the details container is now empty, remove it too
            if (detailsContainer && detailsContainer.childElementCount === 0) {
                detailsContainer.remove();
            }
        }

        showModal("Coupon deleted successfully!", true);
    } catch (error) {
        console.error("Error deleting coupon:", error.message);
        showModal("Failed to delete coupon.", false );
        console.error(error.stack);
    }
    });
}
    
// Call fetchData when the page loads
document.addEventListener("DOMContentLoaded", fetchData);