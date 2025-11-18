import { useState, useEffect, useCallback } from 'react';

export const useDataParsing = (drawing) => {
  const [questionsData, setQuestionsData] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Parse drawing data from drawing object
  const parseDrawingData = useCallback((drawing) => {
    console.log('parseDrawingData - input drawing:', drawing);
    console.log('parseDrawingData - drawing.answers:', drawing?.answers);
    
    if (!drawing?.answers) {
      console.log('parseDrawingData - no answers found, returning empty array');
      return [];
    }
    
    try {
      // Handle string answers
      if (typeof drawing.answers === 'string') {
        console.log('parseDrawingData - parsing string answers');
        const parsed = JSON.parse(drawing.answers);
        console.log('parseDrawingData - parsed string result:', parsed);
        
        // Check if it's the new format with lines and textBoxes
        if (parsed && typeof parsed === 'object' && parsed.lines) {
          console.log('parseDrawingData - new format detected with lines and textBoxes');
          return parsed;
        }
        
        // Fallback to old format (array of strokes)
        return parsed;
      }
      
      // Handle object answers (new format)
      if (drawing.answers && typeof drawing.answers === 'object' && drawing.answers.lines) {
        console.log('parseDrawingData - answers is new format object');
        return drawing.answers;
      }
      
      // Handle array answers (old or mixed formats)
      if (Array.isArray(drawing.answers)) {
        console.log('parseDrawingData - answers is array');
        // If elements are strings, try to JSON.parse each
        const needParse = drawing.answers.every(a => typeof a === 'string');
        if (needParse) {
          try {
            const parsedArray = drawing.answers.map((s) => {
              try { return JSON.parse(s); } catch { return s; }
            });
            console.log('parseDrawingData - parsed array elements');
            return parsedArray;
          } catch (e) {
            console.log('parseDrawingData - failed to parse array elements, returning raw');
            return drawing.answers;
          }
        }
        return drawing.answers;
      }
      
      console.log('parseDrawingData - answers is neither string nor array, returning empty array');
      return [];
    } catch (error) {
      console.error('Error parsing drawing data:', error);
      return [];
    }
  }, []);

  // Process questions from answers - FIXED: Group strokes by canvas/question
  const processQuestions = useCallback((answers) => {
    console.log('processQuestions - input answers:', answers);
    console.log('processQuestions - answers type:', typeof answers);
    console.log('processQuestions - answers isArray:', Array.isArray(answers));
    
    // Handle new format with lines and textBoxes (single canvas)
    if (answers && typeof answers === 'object' && answers.lines) {
      console.log('processQuestions - new format detected with lines and textBoxes');
      console.log('processQuestions - lines count:', answers.lines?.length);
      console.log('processQuestions - textBoxes count:', answers.textBoxes?.length);
      
      // Group strokes by canvas (same logic as before)
      const canvasGroups = groupStrokesByCanvas(answers.lines);
      console.log('processQuestions - canvas groups:', canvasGroups);
      console.log('processQuestions - number of canvas groups:', canvasGroups.length);
      
      return canvasGroups.map((canvasStrokes, canvasIndex) => {
        console.log(`processQuestions - canvas ${canvasIndex} strokes:`, canvasStrokes);
        console.log(`processQuestions - canvas ${canvasIndex} stroke count:`, canvasStrokes.length);
        
        return {
          questionNumber: canvasIndex + 1,
          drawingData: canvasStrokes,
          textBoxes: answers.textBoxes || [] // Include text boxes for each question
        };
      });
    }
    
    // Handle array of entries where each entry is an object with lines/textBoxes (multi-canvas)
    if (Array.isArray(answers) && answers.every(a => a && typeof a === 'object' && a.lines)) {
      console.log('processQuestions - array of {lines,textBoxes} detected');
      return answers.map((entry, idx) => ({
        questionNumber: idx + 1,
        drawingData: entry.lines || [],
        textBoxes: entry.textBoxes || []
      }));
    }

    // Handle old format (array of strokes)
    if (!Array.isArray(answers)) {
      console.log('processQuestions - answers is not array or object, returning empty array');
      return [];
    }
    
    console.log('processQuestions - processing', answers.length, 'answers (old format)');
    
    // FIXED: Group strokes by canvas instead of treating each stroke as separate question
    const canvasGroups = groupStrokesByCanvas(answers);
    console.log('processQuestions - canvas groups:', canvasGroups);
    console.log('processQuestions - number of canvas groups:', canvasGroups.length);
    
    return canvasGroups.map((canvasStrokes, canvasIndex) => {
      console.log(`processQuestions - canvas ${canvasIndex} strokes:`, canvasStrokes);
      console.log(`processQuestions - canvas ${canvasIndex} stroke count:`, canvasStrokes.length);
      
      return {
        questionNumber: canvasIndex + 1,
        drawingData: canvasStrokes,
        textBoxes: [] // No text boxes in old format
      };
    });
  }, []);

  // Helper function to group strokes by canvas
  const groupStrokesByCanvas = useCallback((answers) => {
    console.log('groupStrokesByCanvas - input answers:', answers);
    
    // Based on the logs: [Array(382), Object, Object, Array(240), Array(612)]
    // This appears to be strokes from 2 questions/canvases
    // We need to group them properly
    
    // Strategy: Analyze the data structure to determine the best grouping approach
    // From the logs, it seems like we have a mix of line segments (arrays) and shapes (objects)
    
    const canvasGroups = [];
    
    // Try different grouping strategies based on the data patterns
    const strategy = determineGroupingStrategy(answers);
    console.log('groupStrokesByCanvas - using strategy:', strategy);
    
    if (strategy === 'by_question_boundary') {
      // Group by question boundaries (every 2-3 strokes per question)
      return groupByQuestionBoundary(answers);
    } else if (strategy === 'by_stroke_type') {
      // Group by stroke type (arrays vs objects)
      return groupByStrokeType(answers);
    } else {
      // Default: treat as single canvas with all strokes
      return [answers];
    }
  }, []);

  // Determine the best grouping strategy based on data patterns
  const determineGroupingStrategy = useCallback((answers) => {
    console.log('determineGroupingStrategy - analyzing answers:', answers);
    
    // Count different types of strokes
    let arrayCount = 0;
    let objectCount = 0;
    
    answers.forEach(answer => {
      if (Array.isArray(answer)) {
        arrayCount++;
      } else if (typeof answer === 'object') {
        objectCount++;
      }
    });
    
    console.log('determineGroupingStrategy - arrayCount:', arrayCount, 'objectCount:', objectCount);
    
    // If we have a mix of arrays and objects, try grouping by type
    if (arrayCount > 0 && objectCount > 0) {
      return 'by_stroke_type';
    }
    
    // If we have many strokes, try grouping by question boundary
    if (answers.length > 3) {
      return 'by_question_boundary';
    }
    
    // Default: single canvas
    return 'single_canvas';
  }, []);

  // Group by question boundary (every 2-3 strokes per question)
  const groupByQuestionBoundary = useCallback((answers) => {
    console.log('groupByQuestionBoundary - grouping answers:', answers);
    
    const canvasGroups = [];
    let currentCanvas = [];
    
    // Simple heuristic: group every 2-3 strokes as a question
    const strokesPerQuestion = Math.ceil(answers.length / 2); // Assume 2 questions
    
    for (let i = 0; i < answers.length; i++) {
      currentCanvas.push(answers[i]);
      
      // Start new canvas after every strokesPerQuestion strokes
      if ((i + 1) % strokesPerQuestion === 0 && i < answers.length - 1) {
        canvasGroups.push([...currentCanvas]);
        currentCanvas = [];
      }
    }
    
    // Add the last canvas
    if (currentCanvas.length > 0) {
      canvasGroups.push(currentCanvas);
    }
    
    console.log('groupByQuestionBoundary - result:', canvasGroups);
    return canvasGroups;
  }, []);

  // Group by stroke type (arrays vs objects)
  const groupByStrokeType = useCallback((answers) => {
    console.log('groupByStrokeType - grouping answers:', answers);
    
    const arrayStrokes = [];
    const objectStrokes = [];
    
    answers.forEach(answer => {
      if (Array.isArray(answer)) {
        arrayStrokes.push(answer);
      } else if (typeof answer === 'object') {
        objectStrokes.push(answer);
      }
    });
    
    const canvasGroups = [];
    if (arrayStrokes.length > 0) canvasGroups.push(arrayStrokes);
    if (objectStrokes.length > 0) canvasGroups.push(objectStrokes);
    
    console.log('groupByStrokeType - result:', canvasGroups);
    return canvasGroups;
  }, []);

  // Parse drawing data when drawing changes
  useEffect(() => {
    if (drawing) {
      console.log('useDataParsing - drawing object:', drawing);
      console.log('useDataParsing - drawing.answers:', drawing.answers);
      console.log('useDataParsing - drawing.answers type:', typeof drawing.answers);
      console.log('useDataParsing - drawing.answers length:', drawing.answers?.length);
      const answers = parseDrawingData(drawing);
      console.log('useDataParsing - parsed answers:', answers);
      console.log('useDataParsing - parsed answers type:', typeof answers);
      console.log('useDataParsing - parsed answers length:', answers?.length);
      const questions = processQuestions(answers);
      console.log('useDataParsing - processed questions:', questions);
      console.log('useDataParsing - processed questions length:', questions?.length);
      if (questions.length > 0) {
        console.log('useDataParsing - first question drawingData:', questions[0]?.drawingData);
        console.log('useDataParsing - first question drawingData length:', questions[0]?.drawingData?.length);
      }
      setQuestionsData(questions);
      setCurrentQuestionIndex(0);
    }
  }, [drawing, parseDrawingData, processQuestions]);

  return {
    questionsData,
    setQuestionsData,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    parseDrawingData,
    processQuestions,
  };
};
