// Store student bus assignments
let studentBusAssignments = {};

// Bus stop locations for each bus
const busStops = {
    'bus1': [
        'Koteshwor',
        'Tinkune',
        'New Baneshwor',
        'Mid Baneshwor',
        'Old Baneshwor'
    ],
    'bus2': [
        'Kalanki',
        'Kalimati',
        'Tripureshwor',
        'Maitighar',
        'Thapathali'
    ]
};

// Global variable to store the currently selected student
let selectedStudentId = null;

// Function to fetch student data from Google Sheet
async function fetchStudentData() {
    // Use the export URL for CSV format
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1m0XoXRhxfLxIQ61dmHtO8R2iyiCUWqli3WpxXW1CI94/export?format=csv&gid=57740857';
    
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));
        
        // Skip header row and process data
        const studentsByClass = {};
        
        // Process each row starting from row 1 (skip header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 6) continue;
            
            // Get values from specific columns based on your sheet
            const sn = row[0]?.trim(); // SN
            const name = row[1]?.trim(); // Name
            const gender = row[2]?.trim(); // Boy/Girl
            const className = row[4]?.trim(); // Class
            const phone = row[6]?.trim(); // Phone (R)
            
            // Skip if we don't have essential data
            if (!name || !className) continue;
            
            // Initialize array for this class if it doesn't exist
            if (!studentsByClass[className]) {
                studentsByClass[className] = [];
            }
            
            // Add student to their class
            studentsByClass[className].push({
                id: sn,
                name: name,
                gender: gender,
                phone: phone,
                class: className
            });
        }
        
        console.log('Students by class:', studentsByClass);
        return studentsByClass;
    } catch (error) {
        console.error('Error fetching student data:', error);
        return {}; // Return empty object if fetch fails
    }
}

// Initialize the page with student data
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get DOM elements
        const classSelect = document.getElementById('classSelect');
        const studentList = document.getElementById('studentList');
        
        // Fetch student data first
        const studentData = await fetchStudentData();
        console.log('Fetched student data:', studentData);
        
        // Get available classes from the data
        const availableClasses = Object.keys(studentData).sort((a, b) => {
            // Convert class names to numbers for sorting, treating non-numeric classes specially
            const aNum = parseInt(a);
            const bNum = parseInt(b);
            if (isNaN(aNum) && isNaN(bNum)) return a.localeCompare(b);
            if (isNaN(aNum)) return -1;
            if (isNaN(bNum)) return 1;
            return aNum - bNum;
        });
        
        // Add class options
        classSelect.innerHTML = '<option value="">Select Class</option>';
        availableClasses.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = `Class ${className}`;
            classSelect.appendChild(option);
        });
        
        // Store data globally
        window.studentsByClass = studentData;
        window.studentBusAssignments = {};
        
        // Display students when class is selected
        classSelect.addEventListener('change', () => {
            const selectedClass = classSelect.value;
            studentList.innerHTML = '';
            
            if (!selectedClass) return;
            
            const students = studentData[selectedClass] || [];
            if (students.length === 0) {
                studentList.innerHTML = '<div class="error">No students found in this class</div>';
                return;
            }
            
            students.forEach(student => {
                const studentCard = document.createElement('div');
                studentCard.className = 'student-card';
                
                const assignment = window.studentBusAssignments[student.id];
                let busInfo = 'No bus assignment';
                
                if (assignment) {
                    busInfo = `Pick: ${assignment.pickupBus} (${assignment.pickupStop}) | Drop: ${assignment.dropoffBus} (${assignment.dropoffStop})`;
                }
                
                studentCard.innerHTML = `
                    <div class="student-info">
                        <div class="student-name"><strong>${student.name}</strong> ${student.gender.toLowerCase() === 'female' ? '👧' : '👦'}</div>
                        <div class="student-details">
                            <span>Phone: ${student.phone || 'N/A'}</span>
                        </div>
                        <div class="bus-info">${busInfo}</div>
                    </div>
                `;
                
                studentCard.addEventListener('click', () => selectStudent(student));
                studentList.appendChild(studentCard);
            });
        });
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Select a student and show bus assignment form
function selectStudent(student) {
    selectedStudentId = student.id;
    // Remove previous selection
    const previousSelected = document.querySelector('.student-card.selected');
    if (previousSelected) previousSelected.classList.remove('selected');
    
    // Add selection to clicked student
    const studentCard = event.target.closest('.student-card');
    studentCard.classList.add('selected');
    
    // Show bus selection form and hide initial message
    const busSelectionForm = document.getElementById('busSelectionForm');
    busSelectionForm.classList.remove('hidden');
    const initialMessage = document.getElementById('initialMessage');
    initialMessage.classList.add('hidden');
    
    // Update selected student name
    const selectedStudentName = document.getElementById('selectedStudentName');
    selectedStudentName.textContent = student.name;
    
    // Reset same location checkbox
    const sameLocation = document.getElementById('sameLocation');
    sameLocation.checked = false;
    const dropoffBus = document.getElementById('dropoffBus');
    dropoffBus.closest('.bus-section').classList.remove('disabled');
    
    // Load existing assignments
    const assignment = window.studentBusAssignments[student.id];
    if (assignment) {
        const pickupBus = document.getElementById('pickupBus');
        pickupBus.value = assignment.pickupBus;
        dropoffBus.value = assignment.dropoffBus;
        const pickupStop = document.getElementById('pickupStop');
        const dropoffStop = document.getElementById('dropoffStop');
        updateStops(assignment.pickupBus, pickupStop, assignment.pickupStop);
        updateStops(assignment.dropoffBus, dropoffStop, assignment.dropoffStop);
        
        // Check if pickup and dropoff are the same
        if (assignment.pickupBus === assignment.dropoffBus && 
            assignment.pickupStop === assignment.dropoffStop) {
            sameLocation.checked = true;
            dropoffBus.closest('.bus-section').classList.add('disabled');
        }
    } else {
        const pickupBus = document.getElementById('pickupBus');
        pickupBus.value = '';
        dropoffBus.value = '';
        const pickupStop = document.getElementById('pickupStop');
        const dropoffStop = document.getElementById('dropoffStop');
        pickupStop.innerHTML = '<option value="">Select Location</option>';
        dropoffStop.innerHTML = '<option value="">Select Location</option>';
    }
}

// Update stops based on selected bus
function updateStops(busId, stopSelect, selectedValue = '') {
    stopSelect.innerHTML = '<option value="">Select Location</option>';
    
    if (!busId) return;
    
    busStops[busId].forEach(stop => {
        const option = document.createElement('option');
        option.value = stop;
        option.textContent = stop;
        option.selected = stop === selectedValue;
        stopSelect.appendChild(option);
    });
}

// Handle bus selection changes
const pickupBus = document.getElementById('pickupBus');
pickupBus.addEventListener('change', () => {
    const pickupStop = document.getElementById('pickupStop');
    updateStops(pickupBus.value, pickupStop);
    if (document.getElementById('sameLocation').checked) {
        copyPickupToDropoff();
    }
});

const dropoffBus = document.getElementById('dropoffBus');
dropoffBus.addEventListener('change', () => {
    const dropoffStop = document.getElementById('dropoffStop');
    updateStops(dropoffBus.value, dropoffStop);
});

// Handle same location checkbox
const sameLocation = document.getElementById('sameLocation');
sameLocation.addEventListener('change', function() {
    const dropoffSection = dropoffBus.closest('.bus-section');
    
    if (this.checked) {
        dropoffSection.classList.add('disabled');
        copyPickupToDropoff();
    } else {
        dropoffSection.classList.remove('disabled');
    }
});

// Copy pickup details to dropoff
function copyPickupToDropoff() {
    dropoffBus.value = pickupBus.value;
    const dropoffStop = document.getElementById('dropoffStop');
    updateStops(dropoffBus.value, dropoffStop, document.getElementById('pickupStop').value);
}

// Save student bus assignment
async function saveBusAssignment() {
    if (!selectedStudentId) {
        alert('Please select a student first');
        return;
    }

    // Get form values
    const pickupBus = document.getElementById('pickupBus').value.trim();
    const pickupStop = document.getElementById('pickupStop').value.trim();
    const dropoffBus = document.getElementById('dropoffBus').value.trim();
    const dropoffStop = document.getElementById('dropoffStop').value.trim();

    // Validate inputs
    if (!pickupBus || !pickupStop || !dropoffBus || !dropoffStop) {
        alert('Please fill in all fields');
        return;
    }

    // Create assignment object
    const assignment = {
        studentId: selectedStudentId,
        pickupBus,
        pickupStop,
        dropoffBus,
        dropoffStop,
        timestamp: new Date().toISOString()
    };

    try {
        // Save to Google Sheets (you'll need to implement this API endpoint)
        const response = await fetch('/api/save-bus-assignment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assignment)
        });

        if (!response.ok) {
            throw new Error('Failed to save assignment');
        }

        // Update local storage
        window.studentBusAssignments[selectedStudentId] = assignment;

        // Update the UI
        const studentList = document.getElementById('studentList');
        const selectedClass = document.getElementById('classSelect').value;
        const students = window.studentsByClass[selectedClass] || [];
        
        // Refresh the student list to show updated assignment
        studentList.innerHTML = '';
        students.forEach(student => {
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            
            const currentAssignment = window.studentBusAssignments[student.id];
            let busInfo = 'No bus assignment';
            
            if (currentAssignment) {
                busInfo = `Pick: ${currentAssignment.pickupBus} (${currentAssignment.pickupStop}) | Drop: ${currentAssignment.dropoffBus} (${currentAssignment.dropoffStop})`;
            }
            
            studentCard.innerHTML = `
                <div class="student-info">
                    <div class="student-name"><strong>${student.name}</strong> ${student.gender.toLowerCase() === 'female' ? '👧' : '👦'}</div>
                    <div class="student-details">
                        <span>Phone: ${student.phone || 'N/A'}</span>
                    </div>
                    <div class="bus-info">${busInfo}</div>
                </div>
            `;
            
            studentCard.addEventListener('click', () => selectStudent(student));
            studentList.appendChild(studentCard);
        });

        // Show success message
        alert('Bus assignment saved successfully!');
    } catch (error) {
        console.error('Error saving bus assignment:', error);
        alert('Failed to save bus assignment. Please try again.');
    }
}

// Add styles
const newStyles = `
.student-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.student-name {
    font-size: 1.1rem;
    color: #2c3e50;
}

.student-details {
    font-size: 0.9em;
    color: #666;
}

.student-details span {
    margin-right: 0.5rem;
}

.bus-info {
    font-size: 0.9em;
    color: #666;
    margin-top: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid #eee;
}

.loading, .error {
    padding: 1rem;
    text-align: center;
    color: #666;
}

.error {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 5px;
}
`;

// Create and append style element
const styleSheet = document.createElement("style");
styleSheet.textContent = newStyles;
document.head.appendChild(styleSheet);

// Add event listener to save button
document.getElementById('saveAssignment').addEventListener('click', saveBusAssignment);
