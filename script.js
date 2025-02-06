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

// Function to fetch and process student data from Google Sheet
async function fetchStudentData() {
    // Google Sheet CSV export URL
    const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1m0XoXRhxfLxIQ61dmHtO8R2iyiCUWqli3WpxXW1CI94/export?format=csv&gid=57740857';
    
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const csvText = await response.text();
        console.log('Raw CSV text:', csvText); // Log raw CSV data
        
        const rows = csvText.split('\n').map(row => row.split(','));
        console.log('All rows:', rows); // Log all rows
        
        // Manually add classes for testing
        const studentsByClass = {
            'Nursery': [],
            'LKG': [],
            'UKG': [],
            '1': [],
            '2': [],
            '3': [],
            '4': [],
            '5': [],
            '6': [],
            '7': [],
            '8': [],
            '9': [],
            '10': []
        };
        
        // Process each row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 4) continue;
            
            // Get values from specific columns based on your Excel sheet
            const rollNo = row[0]?.trim(); // First column
            const name = row[1]?.trim(); // Second column
            const phone = row[6]?.trim(); // Seventh column (SMS Mobile Number)
            const gender = ''; // We'll leave this empty for now
            
            // Extract class from roll number (first digit)
            let className = rollNo?.charAt(0);
            
            // Convert numeric classes to strings
            if (className && !isNaN(className)) {
                className = className.toString();
            }
            
            // Skip if we don't have essential data
            if (!name || !className) continue;
            
            // Add student to the appropriate class
            if (studentsByClass[className]) {
                studentsByClass[className].push({
                    id: studentsByClass[className].length + 1,
                    name: name,
                    gender: gender,
                    rollNo: rollNo,
                    phone: phone,
                    class: className,
                    section: ''
                });
            }
        }
        
        // Remove empty classes
        Object.keys(studentsByClass).forEach(className => {
            if (studentsByClass[className].length === 0) {
                delete studentsByClass[className];
            }
        });
        
        console.log('Final processed data:', studentsByClass);
        return studentsByClass;
        
    } catch (error) {
        console.error('Error fetching student data:', error);
        // Return empty classes as fallback
        return {
            'Nursery': [],
            'LKG': [],
            'UKG': [],
            '1': [],
            '2': [],
            '3': [],
            '4': [],
            '5': [],
            '6': [],
            '7': [],
            '8': [],
            '9': [],
            '10': []
        };
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get DOM elements
        const classSelect = document.getElementById('classSelect');
        const studentList = document.getElementById('studentList');
        
        // Fetch student data
        const studentData = await fetchStudentData();
        
        // Update class dropdown
        classSelect.innerHTML = '<option value="">Select Class</option>';
        
        // Add all possible classes in order
        const allClasses = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        allClasses.forEach(className => {
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
                        <div class="student-name"><strong>${student.name}</strong> ${student.gender === 'Female' ? '👧' : '👦'}</div>
                        <div class="student-details">
                            <span>Roll No: ${student.rollNo || 'N/A'}</span>
                            <span>• Phone: ${student.phone || 'N/A'}</span>
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
    
    // Add event listeners for saving assignments
    const pickupStop = document.getElementById('pickupStop');
    pickupStop.onchange = () => saveStudentAssignment(student.id);
    const dropoffStop = document.getElementById('dropoffStop');
    dropoffStop.onchange = () => saveStudentAssignment(student.id);
}

// Event Listeners
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

const pickupStop = document.getElementById('pickupStop');
pickupStop.addEventListener('change', () => {
    if (document.getElementById('sameLocation').checked) {
        copyPickupToDropoff();
    }
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
    updateStops(dropoffBus.value, dropoffStop, pickupStop.value);
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

// Save student bus assignment
function saveStudentAssignment(studentId) {
    if (pickupBus.value && pickupStop.value && 
        (sameLocation.checked || (dropoffBus.value && dropoffStop.value))) {
        
        window.studentBusAssignments[studentId] = {
            pickupBus: pickupBus.value,
            pickupStop: pickupStop.value,
            dropoffBus: sameLocation.checked ? pickupBus.value : dropoffBus.value,
            dropoffStop: sameLocation.checked ? pickupStop.value : dropoffStop.value
        };
        displayStudents(); // Refresh the display
    }
}

// Display students for selected class
function displayStudents() {
    const selectedClass = document.getElementById('classSelect').value;
    const studentList = document.getElementById('studentList');
    studentList.innerHTML = '';
    
    if (!selectedClass) return;
    
    const students = window.studentsByClass[selectedClass] || [];
    
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
                <div class="student-name"><strong>${student.name}</strong> ${student.gender === 'Female' ? '👧' : '👦'}</div>
                <div class="student-details">
                    <span>Roll No: ${student.rollNo || 'N/A'}</span>
                    <span>• Phone: ${student.phone || 'N/A'}</span>
                </div>
                <div class="bus-info">${busInfo}</div>
            </div>
        `;
        
        studentCard.addEventListener('click', () => selectStudent(student));
        studentList.appendChild(studentCard);
    });
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
